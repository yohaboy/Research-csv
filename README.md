# UNISA Research Management System

A comprehensive Django-based research management system designed to track and analyze academic publications, authors, and research groups at the University of South Australia (UNISA). The system integrates with multiple academic APIs to automatically fetch publication data and provides detailed analytics and reporting capabilities.

## 🚀 Features

### Core Functionality

- **Author Management**: Import and manage researchers with their Scopus, Google Scholar, and ORCID identifiers
- **Publication Tracking**: Automatically fetch and store publications from multiple academic databases
- **Research Group Analytics**: Track publications and collaborations across research groups
- **Keyword Analysis**: Analyze research trends through keyword frequency analysis
- **Multi-group Collaboration Tracking**: Identify and analyze cross-group research collaborations

### Data Sources

- **Scopus API**: Elsevier's comprehensive academic database
- **Google Scholar**: Web-based academic search engine
- **ORCID API**: Open researcher and contributor ID system
- **UNISA Staff Pages**: Automated scraping of staff profile pages

### Reporting & Analytics

- New publication counts with date filtering
- Keyword frequency analysis across all publications
- Multi-group collaboration statistics
- Per-group publication counts and trends
- Author collaboration patterns

## 🛠️ Technology Stack

- **Backend**: Django 4.2.20
- **Database**: SQLite (development) / PostgreSQL (production)
- **Task Queue**: Celery with Redis
- **APIs**: Scopus, Google Scholar, ORCID
- **Frontend**: Django Templates with Bootstrap

## 📋 Prerequisites

- Python 3.8+
- Redis server
- Scopus API key (optional)
- Internet connection for API calls

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd unisa_research
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install django
pip install celery
pip install redis
pip install requests
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key-here
SCOPUS_API_KEY=your-scopus-api-key
DEBUG=True
```

### 5. Initialize Database

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Start Redis Server

```bash
redis-server
```

### 7. Start Celery Worker

```bash
celery -A unisa_research worker --loglevel=info
```

### 8. Run Development Server

```bash
python manage.py runserver
```

## 📊 Usage

### 1. Import Authors

- Navigate to `/upload/`
- Upload a CSV file with author information
- CSV format: `firstName,lastName,group,scopus,scholar,orcid`

### 2. Fetch Publications

- Click "Fetch Publications" to trigger background publication retrieval
- System will automatically query Scopus, Google Scholar, and ORCID APIs

### 3. View Reports

- **New Papers**: `/report/new-papers/` - Count of recent publications
- **Keyword Analysis**: `/report/keyword-counts/` - Keyword frequency analysis
- **Multi-group Papers**: `/report/multi-group-papers/` - Cross-group collaborations
- **Group Analytics**: `/report/total-papers-per-group/` - Publications per research group

## 🗄️ Database Schema

### Models

- **ResearchGroup**: Research groups/departments
- **Author**: Individual researchers with API identifiers
- **Publication**: Academic papers and publications
- **AuthorPublication**: Many-to-many relationship with author order

### Key Relationships

- Authors belong to Research Groups
- Publications can have multiple authors
- AuthorPublication tracks author order and relationships

## 🔧 Configuration

### API Keys

- **Scopus**: Register at [Elsevier Developer Portal](https://dev.elsevier.com/)
- **Google Scholar**: No API key required (web scraping)
- **ORCID**: No API key required (public API)

### Celery Configuration

```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
```

## 📈 API Integration

### Scopus API

- Endpoint: `https://api.elsevier.com/content/search/scopus`
- Returns: Title, publication date, keywords, abstract
- Rate limits: 25,000 requests per week

### Google Scholar

- Method: Web scraping
- Returns: Title, publication year
- Note: Limited by Google's terms of service

### ORCID API

- Endpoint: `https://pub.orcid.org/v3.0/{orcid_id}/works`
- Returns: Title, publication date
- Public API with no authentication required

## 🔍 Troubleshooting

### Common Issues

1. **Celery Worker Not Starting**

   - Ensure Redis server is running
   - Check Redis connection settings

2. **API Rate Limits**

   - Implement request throttling
   - Use background tasks for large datasets

3. **Database Errors**
   - Run `python manage.py makemigrations`
   - Run `python manage.py migrate`

### Debug Mode

Set `DEBUG = True` in settings.py for detailed error messages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Elsevier for Scopus API access
- Google Scholar for academic data
- ORCID for researcher identification
- Django community for the excellent framework

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the Django documentation

---

**Note**: This system is designed for academic research tracking and should be used in compliance with the terms of service of all integrated APIs.
