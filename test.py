import requests

API_KEY = 'eff41c02e7bb9b369a0e5b5336f8ae23'
HEADERS = {
    'Accept': 'application/json',
    'X-ELS-APIKey': API_KEY,
}
doc_scopus_id = 57941407600

params = {
    'view': 'META',  # minimal access
}
resp = requests.get(
    f"https://api.elsevier.com/content/abstract/scopus_id/{doc_scopus_id}",
    headers=HEADERS, params=params)
print(resp.status_code, resp.text)

