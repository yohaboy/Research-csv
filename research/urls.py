from django.urls import path
from . import views
from .api import (
    AuthorList, ResearchGroupList, PublicationList,
    NewPublicationsCount, KeywordCounts, MultiGroupPapersCount,
    GroupAuthorMultiGroup, TotalPapersPerGroup, KeywordCountsPerGroup,
    TriggerFetchPublications, CheckTaskStatus
)

urlpatterns = [
    path('', views.index, name='index'),
    path('upload/', views.upload_file, name='upload_csv'),
    path('report/new-papers/', views.report_new_papers, name='report_new_papers'),
    path('report/keyword-counts/', views.report_keyword_counts, name='report_keyword_counts'),
    path('report/multi-group-papers/', views.report_multi_group_papers, name='report_multi_group_papers'),
    path('report/group-author-multi-group/', views.report_group_author_multi_group, name='report_group_author_multi_group'),
    path('report/total-papers-per-group/', views.report_total_papers_per_group, name='report_total_papers_per_group'),
    path('report/keyword-counts-per-group/', views.report_keyword_counts_per_group, name='report_keyword_counts_per_group'),
    path('fetch-publications/', views.trigger_fetch_publications, name='fetch_publications'),
    path('check_csv_task_status/', views.check_csv_task_status, name='check_csv_task_status'),
    path('scholar/', views.scholar_dashboard, name='scholar_dashboard'),
    path('authors/', views.author_details, name='author_details'),

        # API URLs
    path('api/authors/', AuthorList.as_view(), name='api_authors'),
    path('api/groups/', ResearchGroupList.as_view(), name='api_groups'),
    path('api/publications/', PublicationList.as_view(), name='api_publications'),
    path('api/stats/new-papers/', NewPublicationsCount.as_view(), name='api_new_papers'),
    path('api/stats/keywords/', KeywordCounts.as_view(), name='api_keywords'),
    path('api/stats/multi-group-papers/', MultiGroupPapersCount.as_view(), name='api_multi_group_papers'),
    path('api/stats/group-author-multi-group/', GroupAuthorMultiGroup.as_view(), name='api_group_author_multi_group'),
    path('api/stats/total-papers-per-group/', TotalPapersPerGroup.as_view(), name='api_total_papers_per_group'),
    path('api/stats/keywords-per-group/', KeywordCountsPerGroup.as_view(), name='api_keywords_per_group'),
    path('api/fetch-publications/', TriggerFetchPublications.as_view(), name='api_fetch_publications'),
    path('api/check-task-status/', CheckTaskStatus.as_view(), name='api_check_task_status'),
] 
