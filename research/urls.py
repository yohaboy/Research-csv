from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('upload/', views.upload_csv, name='upload_csv'),
    path('report/new-papers/', views.report_new_papers, name='report_new_papers'),
    path('report/keyword-counts/', views.report_keyword_counts, name='report_keyword_counts'),
    path('report/multi-group-papers/', views.report_multi_group_papers, name='report_multi_group_papers'),
    path('report/group-author-multi-group/', views.report_group_author_multi_group, name='report_group_author_multi_group'),
    path('report/total-papers-per-group/', views.report_total_papers_per_group, name='report_total_papers_per_group'),
    path('report/keyword-counts-per-group/', views.report_keyword_counts_per_group, name='report_keyword_counts_per_group'),
    path('fetch-publications/', views.trigger_fetch_publications, name='fetch_publications'),
] 