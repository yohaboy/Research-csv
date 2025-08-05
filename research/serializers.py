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
    class Meta:
        model = Publication
        fields = '__all__'

class AuthorPublicationSerializer(serializers.ModelSerializer):
    author = AuthorSerializer()
    publication = PublicationSerializer()
    
    class Meta:
        model = AuthorPublication
        fields = '__all__'