from rest_framework import serializers
from .models import Author, ResearchGroup, Publication, AuthorPublication

class ResearchGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchGroup
        fields = '__all__'

class AuthorSerializer(serializers.ModelSerializer):
    research_group = ResearchGroupSerializer()
    
    class Meta:
        model = Author
        fields = '__all__'

class PublicationSerializer(serializers.ModelSerializer):
    authors = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = '__all__'

    def get_authors(self, obj):
        author_pubs = AuthorPublication.objects.filter(publication=obj).select_related('author__research_group')
        return AuthorSerializer([ap.author for ap in author_pubs], many=True).data

class AuthorPublicationSerializer(serializers.ModelSerializer):
    author = AuthorSerializer()
    publication = PublicationSerializer()
    
    class Meta:
        model = AuthorPublication
        fields = '__all__'