from celery import shared_task, group
from datetime import datetime, timedelta
import csv
import io
from research.models import Author, ResearchGroup
from .views import robust_scrape_staff_ids, fetch_and_store_publications_for_author

@shared_task
def fetch_publications_for_author_task(author_id, since_date_str):
    from research.models import Author
    from .views import fetch_and_store_publications_for_author
    author = Author.objects.get(id=author_id)
    since_date = datetime.strptime(since_date_str, '%Y-%m-%d').date()
    fetch_and_store_publications_for_author(author, since_date)

@shared_task
def fetch_publications_task(since_days=365):
    from research.models import Author
    since_date = datetime(2024, 1, 1).date()
    # since_date = datetime.now().date() - timedelta(days=since_days)
    author_ids = list(Author.objects.values_list('id', flat=True))
    job = group(fetch_publications_for_author_task.s(author_id, since_date.strftime('%Y-%m-%d')) for author_id in author_ids)
    result = job.apply_async()

@shared_task
def process_csv_upload(data):
    io_string = io.StringIO(data)
    reader = csv.DictReader(io_string)
    for row in reader:
        first = row.get('firstName', '').strip()
        last = row.get('lastName', '').strip()
        group = row.get('group', '').strip()
        scopus = row.get('scopus', '').strip()
        scholar = row.get('scholar', '').strip()
        orcid = row.get('orcid', '').strip()
        if not (first and last and group):
            continue
        group_obj, _ = ResearchGroup.objects.get_or_create(name=group)
        staff_url = f'https://people.unisa.edu.au/{first}.{last}'
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