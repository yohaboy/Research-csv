from django.contrib import admin
from .models import Author, Publication, AuthorPublication, ResearchGroup

admin.site.register(Author)
admin.site.register(Publication)
admin.site.register(AuthorPublication)
admin.site.register(ResearchGroup)
