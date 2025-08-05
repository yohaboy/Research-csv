from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated ,AllowAny
from django.db.models import Q
from datetime import datetime
from .models import Author, ResearchGroup, Publication, AuthorPublication
from .serializers import (
    AuthorSerializer,
    ResearchGroupSerializer,
    PublicationSerializer,
    AuthorPublicationSerializer
)

class BaseAPIView(APIView):
    permission_classes = [AllowAny]

    def get_since_date(self, request):
        since = request.query_params.get('since')
        if since:
            try:
                return datetime.strptime(since, '%Y-%m-%d').date()
            except ValueError:
                pass
        return None

class AuthorList(generics.ListAPIView):
    queryset = Author.objects.select_related('research_group').all()
    serializer_class = AuthorSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
            Q(first_name__icontains=search_query) | 
            Q(last_name__icontains=search_query)
            )
        return queryset

class ResearchGroupList(generics.ListAPIView):
    queryset = ResearchGroup.objects.all()
    serializer_class = ResearchGroupSerializer
    permission_classes = [AllowAny]

class PublicationList(generics.ListAPIView):
    serializer_class = PublicationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Publication.objects.all()
        
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(author__research_group__id=group_id)
            
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author__id=author_id)
            
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
            
        return queryset.distinct()

class NewPublicationsCount(BaseAPIView):
    def get(self, request):
        since_date = self.get_since_date(request)
        if not since_date:
            return Response(
                {"error": "Invalid or missing 'since' parameter (format: YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        count = Publication.objects.filter(publication_date__gt=since_date).count()
        return Response({"count": count, "since": since_date})

class KeywordCounts(BaseAPIView):
    def get(self, request):
        since_date = self.get_since_date(request)
        qs = Publication.objects.all()
        
        if since_date:
            qs = qs.filter(publication_date__gt=since_date)
            
        keyword_counter = {}
        for pub in qs:
            for kw in pub.keywords.split(','):
                kw = kw.strip().lower()
                if kw:
                    keyword_counter[kw] = keyword_counter.get(kw, 0) + 1
                    
        return Response({"keywords": keyword_counter, "since": since_date})

class MultiGroupPapersCount(BaseAPIView):
    def get(self, request):
        multi_group_pubs = set()
        for pub in Publication.objects.all():
            groups = set(pub.authorpublication_set.select_related('author__research_group')
                        .values_list('author__research_group__name', flat=True))
            if len(groups) > 1:
                multi_group_pubs.add(pub.id)
                
        return Response({"count": len(multi_group_pubs)})

class GroupAuthorMultiGroup(BaseAPIView):
    def get(self, request):
        result = {}
        for group in ResearchGroup.objects.all():
            authors = Author.objects.filter(research_group=group)
            author_counts = {}
            for author in authors:
                count = 0
                for ap in author.authorpublication_set.all():
                    pub = ap.publication
                    groups = set(pub.authorpublication_set.select_related('author__research_group')
                                .values_list('author__research_group__name', flat=True))
                    if len(groups) > 1:
                        count += 1
                if count > 0:
                    author_counts[author.__str__()] = count
            result[group.name] = author_counts
        return Response(result)

class TotalPapersPerGroup(BaseAPIView):
    def get(self, request):
        result = {}
        for group in ResearchGroup.objects.all():
            authors = Author.objects.filter(research_group=group)
            pub_ids = set()
            for author in authors:
                pub_ids.update(author.authorpublication_set.values_list('publication_id', flat=True))
            result[group.name] = len(pub_ids)
        return Response(result)

class KeywordCountsPerGroup(BaseAPIView):
    def get(self, request):
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
        return Response(result)

class TriggerFetchPublications(BaseAPIView):
    def post(self, request):
        from .tasks import fetch_publications_task
        task = fetch_publications_task.delay()
        return Response({"status": "started", "task_id": task.id})

class CheckTaskStatus(BaseAPIView):
    def get(self, request):
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {"error": "No task_id provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        return Response({
            "task_id": task_id,
            "status": result.status,
            "ready": result.ready()
        })