from pybliometrics.scopus import AbstractRetrieval

ab = AbstractRetrieval(14065913400)
print(ab.doi)           # DOI string
print(ab.eid)           # EID
print(ab.scopus_link)   # Link to publication (optional helper)
