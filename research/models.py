from django.db import models

class ResearchGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Author(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    research_group = models.ForeignKey(ResearchGroup, on_delete=models.CASCADE)
    scopus_id = models.CharField(max_length=100, blank=True, null=True)
    scholar_id = models.CharField(max_length=100, blank=True, null=True)
    orcid_id = models.CharField(max_length=100, blank=True, null=True)
    staff_url = models.URLField(max_length=255)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Publication(models.Model):
    title = models.CharField(max_length=500)
    publication_date = models.DateField()
    keywords = models.TextField(blank=True)
    abstract = models.TextField(blank=True)
    date_added = models.DateTimeField(auto_now_add=True)
    url = models.URLField(max_length=500, blank=True, null=True)
    source = models.CharField(max_length=50, choices=[('Scopus', 'Scopus'), ('Google Scholar', 'Google Scholar'), ('ORCID', 'ORCID')], blank=True, null=True)
    def __str__(self):
        return self.title

class AuthorPublication(models.Model):
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    publication = models.ForeignKey(Publication, on_delete=models.CASCADE)
    author_order = models.PositiveIntegerField()

    class Meta:
        unique_together = ('author', 'publication', 'author_order')
