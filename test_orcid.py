import requests
from datetime import datetime

def query_orcid_api(orcid_id, since_date):
    url = f'https://pub.orcid.org/v3.0/{orcid_id}/works'
    headers = {'Accept': 'application/json'}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"HTTP status: {resp.status_code}")
        if resp.status_code != 200:
            print("Non-200 response, returning empty list.")
            return []

        data = resp.json()
        print(f"Raw JSON keys in response: {data.keys()}")

        results = []
        groups = data.get('group', [])
        print(f"Found {len(groups)} groups in works")

        for i, group in enumerate(groups, start=1):
            work_summary = group.get('work-summary', [])
            if not work_summary:
                print(f"Group #{i} has no work-summary, skipping.")
                continue

            work = work_summary[0]

            title = (
                work.get('title', {})
                    .get('title', {})
                    .get('value', '')
                    .strip()
            )
            print(f"Processing work #{i}: '{title}'")

            date_parts = work.get('publication-date')
            if not date_parts:
                print(f"Work #{i} has no publication-date, skipping.")
                continue

            year = date_parts.get('year')
            month = date_parts.get('month')
            day = date_parts.get('day')

            year_value = year.get('value') if year else None
            month_value = month.get('value') if month else None
            day_value = day.get('value') if day else None

            print(f"Work #{i} raw date parts: year={year_value}, month={month_value}, day={day_value}")

            try:
                pub_year = int(year_value) if year_value else 1
                pub_month = int(month_value) if month_value else 1
                pub_day = int(day_value) if day_value else 1
                pub_date = datetime(pub_year, pub_month, pub_day).date()
            except Exception as e:
                print(f"Work #{i} date parsing error: {e}, skipping.")
                continue

            if pub_date < since_date:
                print(f"Work #{i} publication date {pub_date} before since_date {since_date}, skipping.")
                continue

            results.append({
                'title': title,
                'publication_date': pub_date,
                'keywords': '',  # Not available via ORCID API in this endpoint
                'abstract': '',  # Not available via ORCID API in this endpoint
                'author_order': 1,
            })

        print(f"Final results count: {len(results)}")
        return results

    except Exception as e:
        print(f"Unexpected error: {e}")
        return []

if __name__ == "__main__":
    # Example ORCID ID; replace with your real one
    example_orcid_id = "0000-0002-8265-0503"
    since_date = datetime(2023, 1, 1).date()

    results = query_orcid_api(example_orcid_id, since_date)

    print("\nFinal results:\n")
    for r in results:
        print(r)
