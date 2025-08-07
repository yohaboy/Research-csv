import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unisa_research.settings')

app = Celery('unisa_research')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()