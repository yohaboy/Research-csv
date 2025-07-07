from celery import shared_task
from datetime import datetime, timedelta

@shared_task
def fetch_publications_task(since_days=365):
    from .views import fetch_and_store_all_publications
    since_date = datetime(2024, 1, 1).date()
    fetch_and_store_all_publications(since_date) 