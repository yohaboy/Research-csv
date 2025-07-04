from celery import shared_task
from datetime import datetime, timedelta

@shared_task
def fetch_publications_task(since_days=365):
    from .views import fetch_and_store_all_publications
    since_date = datetime.now().date() - timedelta(days=since_days)
    fetch_and_store_all_publications(since_date) 