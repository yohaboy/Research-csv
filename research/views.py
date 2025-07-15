import re
from bs4 import BeautifulSoup
from django.shortcuts import render, redirect
from django import forms
from django.contrib import messages
import csv
import io
import requests
from research.models import Author, ResearchGroup, Publication, AuthorPublication
from urllib.parse import quote
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from django.db.models import Count, Q, F
from django.urls import reverse
import json
from scholarly import scholarly
from django.http import JsonResponse
from celery.result import AsyncResult
from django.views.decorators.csrf import csrf_exempt

class CSVUploadForm(forms.Form):
    csv_file = forms.FileField()

class StaffIDScraper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scopus_id = None
        self.scholar_id = None
        self.orcid_id = None

    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return

        attrs = dict(attrs)
        href = attrs.get('href')
        if not href:
            return

        parsed_url = urlparse(href)

        # Scopus
        if 'scopus.com' in parsed_url.netloc:
            qs = parse_qs(parsed_url.query)
            author_id = qs.get('authorId')
            if author_id:
                self.scopus_id = author_id[0]

        # Google Scholar
        elif 'scholar.google.com' in parsed_url.netloc:
            qs = parse_qs(parsed_url.query)
            user_id = qs.get('user')
            if user_id:
                self.scholar_id = user_id[0]

        # ORCID
        elif 'orcid.org' in parsed_url.netloc:
            # ORCID iDs are in the path
            path_parts = parsed_url.path.strip('/').split('/')
            if path_parts:
                self.orcid_id = path_parts[0]

    def error(self, message):
        pass


def robust_scrape_staff_ids(staff_url, scopus_id, scholar_id, orcid_id):
    """Scrape staff page for missing IDs, robust to structure changes."""
    try:
        resp = requests.get(staff_url, timeout=5)
        if resp.status_code == 200:
            parser = StaffIDScraper()
            parser.feed(resp.text)
            if not scopus_id:
                scopus_id = parser.scopus_id or ''
            if not scholar_id:
                scholar_id = parser.scholar_id or ''
            if not orcid_id:
                orcid_id = parser.orcid_id or ''
    except Exception:
        pass
    return scopus_id, scholar_id, orcid_id

def upload_csv(request):
    if request.method == 'POST':
        form = CSVUploadForm(request.POST, request.FILES)
        if form.is_valid():
            csv_file = form.cleaned_data['csv_file']
            if not csv_file.name.endswith('.csv'):
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'error': 'File is not CSV type'}, status=400)
                messages.error(request, 'File is not CSV type')
                return redirect('upload_csv')
            try:
                data = csv_file.read().decode('utf-8')
                from research.tasks import process_csv_upload
                task = process_csv_upload.delay(data)
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'task_id': task.id, 'message': 'CSV processing started.'})
                messages.success(request, 'CSV upload started! The data will be processed in the background.')
                return redirect('upload_csv')
            except Exception as e:
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'error': str(e)}, status=500)
                messages.error(request, f'Error processing file: {e}')
                return redirect('upload_csv')
    else:
        form = CSVUploadForm()
    return render(request, 'research/upload_csv.html', {'form': form})

@csrf_exempt
def check_csv_task_status(request):
    task_id = request.GET.get('task_id')
    if not task_id:
        return JsonResponse({'error': 'No task_id provided'}, status=400)
    result = AsyncResult(task_id)
    return JsonResponse({'task_id': task_id, 'status': result.status, 'ready': result.ready()})

# --- API Querying and Publication Storage ---
def fetch_and_store_publications_for_author(author, since_date):
    publications = []

    if author.scopus_id:
        publications += query_scopus_api(author.scopus_id, since_date)

    if author.scholar_id:
        publications += query_scholar_api(author.scholar_id, since_date)

    if author.orcid_id:
        publications += query_orcid_api(author.orcid_id, since_date)

    # Deduplicate by (title, publication year)
    unique_pubs = {}
    for pub in publications:
        title = pub['title'].strip().lower()
        pub_year = pub['publication_date'].year if pub['publication_date'] else None
        if not title or not pub_year:
            continue
        key = (title, pub_year)
        if key not in unique_pubs:
            unique_pubs[key] = pub

    # Store publications and author-publication relationships
    for pub in unique_pubs.values():
        keywords = pub.get('keywords', '')
        if isinstance(keywords, list):
            keywords = ', '.join(keywords)
        pub_obj, created = Publication.objects.get_or_create(
            title=pub['title'],
            publication_date=pub['publication_date'],
            defaults={
                'keywords': keywords,
                'abstract': pub.get('abstract', ''),
            }
        )
        AuthorPublication.objects.get_or_create(
            author=author,
            publication=pub_obj,
            author_order=pub.get('author_order', 1)
        )

def fetch_and_store_all_publications(since_date):
    for author in Author.objects.all():
        fetch_and_store_publications_for_author(author, since_date)

API_KEY = 'eff41c02e7bb9b369a0e5b5336f8ae23'
HEADERS = {
    'Accept': 'application/json',
    'X-ELS-APIKey': API_KEY,
}

def search_scopus_pubs(scopus_author_id, since_date, start=0, count=25):
    query = f"AU-ID({scopus_author_id}) AND PUBYEAR > {since_date.year - 1}"
    url = f"https://api.elsevier.com/content/search/scopus?query={query}&count={count}&start={start}"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            print("Search API error:", resp.text)
            return [], 0

        data = resp.json()
        entries = data.get('search-results', {}).get('entry', [])
        total = int(data.get('search-results', {}).get('opensearch:totalResults', '0'))
        return entries, total

    except Exception as e:
        print("Search API Exception:", e)
        return [], 0

def fetch_abstract_details(doc_scopus_id):
    url = f"https://api.elsevier.com/content/abstract/scopus_id/{doc_scopus_id}"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            print(f"Abstract API error for {doc_scopus_id}:", resp.text)
            return {}

        data = resp.json()
        coredata = data.get('abstracts-retrieval-response', {}).get('coredata', {})
        authors = data.get('abstracts-retrieval-response', {}).get('authors', {}).get('author', [])

        abstract = coredata.get('dc:description', '')
        keywords_raw = data.get('abstracts-retrieval-response', {}).get('authkeywords', {}).get('author-keyword', [])
        keywords = [kw.get('$', '') for kw in keywords_raw] if keywords_raw else []

        return {
            'title': coredata.get('dc:title', ''),
            'publication_date': coredata.get('prism:coverDate', ''),
            'abstract': abstract,
            'keywords': keywords,
            'authors': authors,
        }
    except Exception as e:
        print(f"Abstract API Exception for {doc_scopus_id}:", e)
        return {}

def query_scopus_api(scopus_id, since_date):
    all_results = []
    start = 0
    count = 25
    total_results = None

    while True:
        entries, total = search_scopus_pubs(scopus_id, since_date, start=start, count=count)
        if not entries:
            break

        if total_results is None:
            total_results = total
            
        for pub in entries:
            dc_id = pub.get('dc:identifier', '')
            if not dc_id.startswith('SCOPUS_ID:'):
                continue
            doc_id = dc_id.split(':')[1]

            details = fetch_abstract_details(doc_id)

            pub_date_str = details.get('publication_date', '')
            try:
                pub_date = datetime.strptime(pub_date_str, '%Y-%m-%d').date()
            except Exception:
                pub_date = None

            if not pub_date or pub_date < since_date:
                continue

            all_results.append({
                'title': details.get('title', ''),
                'publication_date': pub_date,
                'keywords': details.get('keywords', []),
                'abstract': details.get('abstract', ''),
                'authors': details.get('authors', []),
            })

        start += count
        if start >= total_results:
            break

    return all_results


def query_scholar_api(scholar_id, since_date):
    try:
        author = scholarly.search_author_id(scholar_id)
        author_filled = scholarly.fill(author)
        publications = []
        pubs = author_filled.get('publications', [])

        for pub in pubs:
            pub_filled = scholarly.fill(pub)
            bib = pub_filled.get('bib', {})
            title = bib.get('title', '')
            year = bib.get('pub_year', '')
            try:
                year_int = int(year)
            except Exception:
                continue

            if year_int >= since_date.year:
                abstract = bib.get('abstract', '')
                keywords = ', '.join(bib.get('keywords', [])) if 'keywords' in bib else ''
                publications.append({
                    'title': title,
                    'publication_date': datetime(year_int, 1, 1).date(),
                    'keywords': keywords,
                    'abstract': abstract,
                    'author_order': 1,
                })
        return publications

    except Exception as e:
        print(f"Error scraping Google Scholar profile: {e}")
        return []
    
def query_orcid_api(orcid_id, since_date):
    url = f'https://pub.orcid.org/v3.0/{orcid_id}/works'
    headers = {'Accept': 'application/json'}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return []

        data = resp.json()
        results = []

        for group in data.get('group', []):
            work_summary = group.get('work-summary', [])
            if not work_summary:
                continue

            work = work_summary[0]

            title = (
                work.get('title', {})
                    .get('title', {})
                    .get('value', '')
                    .strip()
            )

            date_parts = work.get('publication-date')
            if not date_parts:
                continue

            year = date_parts.get('year')
            month = date_parts.get('month')
            day = date_parts.get('day')

            year_value = year.get('value') if year else None
            month_value = month.get('value') if month else None
            day_value = day.get('value') if day else None

            # Fallsback to Jan 1 if month/day missing, 0 year if no year
            try:
                pub_year = int(year_value) if year_value else 0
                pub_month = int(month_value) if month_value else 1
                pub_day = int(day_value) if day_value else 1
                pub_date = datetime(pub_year, pub_month, pub_day).date()
            except Exception:
                continue

            if pub_date < since_date:
                continue

            results.append({
                'title': title,
                'publication_date': pub_date,
                'keywords': '',
                'abstract': '',
                'author_order': 1,
            })

        return results

    except Exception:
        return []


def get_new_papers_count(since_date):
    return Publication.objects.filter(publication_date__gt=since_date).count()

def get_keyword_counts(since_date=None):
    qs = Publication.objects.all()
    if since_date:
        qs = qs.filter(publication_date__gt=since_date)
    keyword_counter = {}
    for pub in qs:
        for kw in pub.keywords.split(','):
            kw = kw.strip().lower()
            if kw:
                keyword_counter[kw] = keyword_counter.get(kw, 0) + 1
    return keyword_counter

def get_multi_group_paper_counts():
    # Papers with authors from 2+ research groups
    multi_group_pubs = set()
    for pub in Publication.objects.all():
        groups = set(pub.authorpublication_set.select_related('author__research_group').values_list('author__research_group__name', flat=True))
        if len(groups) > 1:
            multi_group_pubs.add(pub.id)
    return len(multi_group_pubs)

def get_group_author_multi_group_counts():
    # For each group: authors and their count of multi-group papers
    result = {}
    for group in ResearchGroup.objects.all():
        authors = Author.objects.filter(research_group=group)
        author_counts = {}
        for author in authors:
            count = 0
            for ap in author.authorpublication_set.all():
                pub = ap.publication
                groups = set(pub.authorpublication_set.select_related('author__research_group').values_list('author__research_group__name', flat=True))
                if len(groups) > 1:
                    count += 1
            if count > 0:
                author_counts[author.__str__()] = count
        result[group.name] = author_counts
    return result

def get_total_papers_per_group():
    # For each group: total number of papers published
    result = {}
    for group in ResearchGroup.objects.all():
        authors = Author.objects.filter(research_group=group)
        pub_ids = set()
        for author in authors:
            pub_ids.update(author.authorpublication_set.values_list('publication_id', flat=True))
        result[group.name] = len(pub_ids)
    return result

def get_keyword_counts_per_group():
    # For each group: count of papers published per keyword
    result = {}
    for group in ResearchGroup.objects.all():
        authors = Author.objects.filter(research_group=group)
        pub_ids = set()
        for author in authors:
            pub_ids.update(author.authorpublication_set.values_list('publication_id', flat=True))
        keyword_counter = {}
        pubs = Publication.objects.filter(id__in=pub_ids)
        for pub in pubs:
            for kw in pub.keywords.split(','):
                kw = kw.strip().lower()
                if kw:
                    keyword_counter[kw] = keyword_counter.get(kw, 0) + 1
        result[group.name] = keyword_counter
    return result

def index(request):
    context = {
        'authors_count': Author.objects.count(),
        'publications_count': Publication.objects.count(),
        'research_groups_count': ResearchGroup.objects.count(),
        'author_publications_count': AuthorPublication.objects.count(),
    }
    return render(request, 'research/index.html', context)

def report_new_papers(request):
    since = request.GET.get('since')
    since_date = None
    if since:
        try:
            since_date = datetime.strptime(since, '%Y-%m-%d').date()
        except Exception:
            since_date = None
    count = get_new_papers_count(since_date) if since_date else None
    return render(request, 'research/report_new_papers.html', {'count': count, 'since': since})

def report_keyword_counts(request):
    since = request.GET.get('since')
    since_date = None
    if since:
        try:
            since_date = datetime.strptime(since, '%Y-%m-%d').date()
        except Exception:
            since_date = None
    keywords = get_keyword_counts(since_date)
    return render(request, 'research/report_keyword_counts.html', {'keywords': keywords, 'since': since})

def report_multi_group_papers(request):
    count = get_multi_group_paper_counts()
    return render(request, 'research/report_multi_group_papers.html', {'count': count})

def report_group_author_multi_group(request):
    data = get_group_author_multi_group_counts()
    return render(request, 'research/report_group_author_multi_group.html', {'data': data})

def report_total_papers_per_group(request):
    data = get_total_papers_per_group()
    return render(request, 'research/report_total_papers_per_group.html', {'data': data})

def report_keyword_counts_per_group(request):
    data = get_keyword_counts_per_group()
    return render(request, 'research/report_keyword_counts_per_group.html', {'data': data})

def trigger_fetch_publications(request):
    from .tasks import fetch_publications_task
    fetch_publications_task.delay()
    messages.success(request, "Background publication fetch started!")
    return redirect('index')

def scholar_dashboard(request):
    group_id = request.GET.get('group')
    author_id = request.GET.get('author')

    research_groups = ResearchGroup.objects.all()
    authors = Author.objects.select_related('research_group').all()
    publications = Publication.objects.all()
    author_publications = AuthorPublication.objects.select_related('author', 'publication').all()

    # Apply filters
    if group_id:
        authors = authors.filter(research_group_id=group_id)
        author_publications = author_publications.filter(author__research_group_id=group_id)
    if author_id:
        author_publications = author_publications.filter(author_id=author_id)
        publications = publications.filter(id__in=author_publications.values('publication_id'))

    context = {
        'research_groups': research_groups,
        'authors': authors,
        'publications': publications,
        'author_publications': author_publications,
        'selected_group': int(group_id) if group_id else None,
        'selected_author': int(author_id) if author_id else None,
    }
    return render(request, 'research/scholar_dashboard.html', context)

def author_details(request):
    search_query = request.GET.get('search', '')
    authors = Author.objects.select_related('research_group').all()
    
    if search_query:
        authors = authors.filter(
            Q(first_name__icontains=search_query) | 
            Q(last_name__icontains=search_query)
        )
    
    context = {
        'authors': authors,
        'search_query': search_query,
    }
    return render(request, 'research/author_details.html', context)
