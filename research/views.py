from django.shortcuts import render, redirect
from django import forms
from django.contrib import messages
import csv
import io
import requests
from research.models import Author, ResearchGroup, Publication, AuthorPublication
from urllib.parse import quote
from html.parser import HTMLParser
from datetime import datetime, timedelta
from django.db.models import Count, Q, F
from django.urls import reverse
import json

class CSVUploadForm(forms.Form):
    csv_file = forms.FileField()

class StaffIDScraper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scopus_id = None
        self.scholar_id = None
        self.orcid_id = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            href = attrs.get('href', '')
            if href and 'scopus.com' in href:
                self.scopus_id = href.split('authorId=')[-1]
            if href and 'scholar.google.com' in href:
                self.scholar_id = href.split('user=')[-1].split('&')[0]
            if href and 'orcid.org' in href:
                self.orcid_id = href.split('orcid.org/')[-1].split('/')[0]

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
    # Query Scopus
    if author.scopus_id:
        publications += query_scopus_api(author.scopus_id, since_date)
    # Query Google Scholar
    if author.scholar_id:
        publications += query_scholar_api(author.scholar_id, since_date)
    # Query OrcID
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
        # Add author-publication relationship
        AuthorPublication.objects.get_or_create(
            author=author,
            publication=pub_obj,
            author_order=pub.get('author_order', 1)
        )

def fetch_and_store_all_publications(since_date):
    for author in Author.objects.all():
        fetch_and_store_publications_for_author(author, since_date)

# Example stub publication data for API stubs
example_publication = {
    'title': 'Sample Paper',
    'publication_date': datetime.now().date(),
    'keywords': 'example, test',
    'abstract': 'This is a sample abstract.',
    'author_order': 1,
}

def query_scopus_api(scopus_id, since_date):
    """
    Query the Elsevier Scopus API for publications by author ID since a given date.
    Returns a list of dicts: title, publication_date, keywords, abstract, author_order.
    """
    API_KEY = 'YOUR_SCOPUS_API_KEY'  # <-- Replace with your real key
    headers = {
        'Accept': 'application/json',
        'X-ELS-APIKey': API_KEY,
    }
    url = f'https://api.elsevier.com/content/search/scopus?query=AU-ID({scopus_id})&date={since_date.year}'
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return []
        data = resp.json()
        results = []
        for entry in data.get('search-results', {}).get('entry', []):
            title = entry.get('dc:title', '')
            date_str = entry.get('prism:coverDate', '')
            try:
                pub_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except Exception:
                continue
            if pub_date < since_date:
                continue
            keywords = entry.get('authkeywords', '')
            abstract = entry.get('dc:description', '')
            # Author order not available in this endpoint
            results.append({
                'title': title,
                'publication_date': pub_date,
                'keywords': keywords,
                'abstract': abstract,
                'author_order': 1,
            })
        return results
    except Exception:
        return []

def query_scholar_api(scholar_id, since_date):
    """
    Scrape Google Scholar profile for publications since a given date.
    Returns a list of dicts: title, publication_date, keywords, abstract, author_order.
    """
    url = f'https://scholar.google.com/citations?user={scholar_id}&hl=en'
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return []
        html = resp.text
        # Very basic parsing: look for publication rows
        from html.parser import HTMLParser
        class ScholarPubParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.in_title = False
                self.in_year = False
                self.current_title = ''
                self.current_year = ''
                self.pubs = []
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == 'a' and attrs.get('class', '') == 'gsc_a_at':
                    self.in_title = True
                if tag == 'span' and attrs.get('class', '') == 'gsc_a_h gsc_a_hc gs_ibl':
                    self.in_year = True
            def handle_endtag(self, tag):
                if self.in_title and tag == 'a':
                    self.in_title = False
                if self.in_year and tag == 'span':
                    self.in_year = False
            def handle_data(self, data):
                if self.in_title:
                    self.current_title = data.strip()
                if self.in_year:
                    self.current_year = data.strip()
                    if self.current_title and self.current_year.isdigit():
                        year = int(self.current_year)
                        if year >= since_date.year:
                            self.pubs.append({
                                'title': self.current_title,
                                'publication_date': datetime(year, 1, 1).date(),
                                'keywords': '',
                                'abstract': '',
                                'author_order': 1,
                            })
                        self.current_title = ''
                        self.current_year = ''
        parser = ScholarPubParser()
        parser.feed(html)
        return parser.pubs
    except Exception:
        return []

def query_orcid_api(orcid_id, since_date):
    """
    Query the public OrcID API for works since a given date.
    Returns a list of dicts: title, publication_date, keywords, abstract, author_order.
    """
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
