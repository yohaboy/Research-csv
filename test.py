from scholarly import scholarly
from datetime import datetime

def test_fetch():
    scholar_id = 'HVxKghcAAAAJ'
    since_date = datetime(2023, 1, 1).date()

    author = scholarly.search_author_id(scholar_id)
    author_filled = scholarly.fill(author)
    pubs = author_filled.get('publications', [])
    print(f"Total publications found: {len(pubs)}")

    for pub in pubs:
        pub_filled = scholarly.fill(pub)
        bib = pub_filled.get('bib', {})
        title = bib.get('title', '')
        year = bib.get('pub_year', '')
        try:
            year_int = int(year)
        except Exception:
            continue
        if year_int >= since_date.year:
            print(f"{title} ({year_int})")


if __name__ == "__main__":
    test_fetch()
