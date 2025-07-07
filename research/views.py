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
from .tasks import fetch_publications_task
from scholarly import scholarly

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
                messages.error(request, 'File is not CSV type')
                return redirect('upload_csv')
            try:
                data = csv_file.read().decode('utf-8')
                io_string = io.StringIO(data)
                reader = csv.DictReader(io_string)
                for row in reader:
                    first = row.get('firstName', '').strip()
                    last = row.get('lastName', '').strip()
                    group = row.get('group', '').strip()
                    scopus = row.get('scopus', '').strip()
                    scholar = row.get('scholar', '').strip()
                    orcid = row.get('orcid', '').strip()
                    
                    #debugging 
                    
                    print(f"name : {first} {last} , group :{group}")

                    if not (first and last and group):
                        continue
                    group_obj, _ = ResearchGroup.objects.get_or_create(name=group)
                    staff_url = f'https://people.unisa.edu.au/{quote(first)}.{quote(last)}'
                    scopus, scholar, orcid = robust_scrape_staff_ids(staff_url, scopus, scholar, orcid)
                    Author.objects.update_or_create(
                        first_name=first,
                        last_name=last,
                        research_group=group_obj,
                        defaults={
                            'scopus_id': scopus,
                            'scholar_id': scholar,
                            'orcid_id': orcid,
                            'staff_url': staff_url
                        }
                    )
                messages.success(request, 'CSV processed successfully!')
                return redirect('upload_csv')
            except Exception as e:
                messages.error(request, f'Error processing file: {e}')
                return redirect('upload_csv')
    else:
        form = CSVUploadForm()
    return render(request, 'research/upload_csv.html', {'form': form})

# --- API Querying and Publication Storage ---
def fetch_and_store_publications_for_author(author, since_date):
    publications = []

    if author.scopus_id:
        publications += query_scopus_api(author.scopus_id, since_date)

    if author.scholar_id:
        publications += query_scholar_api(author.scholar_id, since_date)

    if author.orcid_id:
        publications += query_orcid_api(author.orcid_id, since_date)

    # Store publications and author-publication relationships
    for pub in publications:
        pub_obj, created = Publication.objects.get_or_create(
            title=pub['title'],
            publication_date=pub['publication_date'],
            defaults={
                'keywords': pub.get('keywords', ''),
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
            print(f"Total results to fetch: {total_results}")

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
        for pub in author_filled.get('publications', []):
            pub_filled = scholarly.fill(pub)
            bib = pub_filled.get('bib', {})
            title = bib.get('title', '')
            year = bib.get('year', '')
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
            work = group.get('work-summary', [{}])[0]
            title = work.get('title', {}).get('title', {}).get('value', '')
            date_parts = work.get('publication-date', {})
            year = int(date_parts.get('year', {}).get('value', 0) or 0)
            month = int(date_parts.get('month', {}).get('value', 1) or 1)
            day = int(date_parts.get('day', {}).get('value', 1) or 1)
            try:
                pub_date = datetime(year, month, day).date()
            except Exception:
                continue
            if pub_date < since_date:
                continue
            # OrcID does not provide keywords/abstract in summary
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
    return render(request, 'research/index.html')

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
    fetch_publications_task.delay()
    messages.success(request, "Background publication fetch started!")
    return redirect('index')
