import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScholarDashboard = () => {
  const [researchGroups, setResearchGroups] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publications, setPublications] = useState([]);
  const [filters, setFilters] = useState({
    group: '',
    author: '',
    source: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.group) params.append('group', filters.group);
      if (filters.author) params.append('author', filters.author);
      if (filters.source) params.append('source', filters.source);

      // Single API call to get all needed data
      const res = await axios.get(`http://127.0.0.1:8000/api/publications/?${params.toString()}`);

      setResearchGroups(Array.isArray(res.data.research_groups) ? res.data.research_groups : []);
      setAuthors(Array.isArray(res.data.authors) ? res.data.authors : []);
      setPublications(Array.isArray(res.data.publications) ? res.data.publications : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Render options for research groups filter
  const renderResearchGroups = () => {
    if (!Array.isArray(researchGroups)) return null;
    return researchGroups.map(group => (
      <option key={group.id} value={group.id}>{group.name}</option>
    ));
  };

  // Render options for authors filter
  const renderAuthors = () => {
    if (!Array.isArray(authors)) return null;
    return authors.map(author => (
      <option key={author.id} value={author.id}>
        {author.first_name} {author.last_name}
      </option>
    ));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <a href="/" className="text-xl font-semibold text-blue-800">
              <i className="bi bi-graph-up mr-2"></i> Research Dashboard
            </a>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-500 hover:text-blue-800">
                <i className="bi bi-house mr-1"></i> Home
              </a>
              <a href="/scholar-dashboard" className="text-blue-800">
                <i className="bi bi-journal-text mr-1"></i> Scholar Dashboard
              </a>
              <a href="/author-details" className="text-gray-500 hover:text-blue-800">
                <i className="bi bi-people mr-1"></i> Author Details
              </a>
            </div>
            <button className="md:hidden text-gray-500">
              <i className="bi bi-list text-2xl"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Research Group</label>
            <select
              name="group"
              value={filters.group}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Research Groups</option>
              {renderResearchGroups()}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <select
              name="author"
              value={filters.author}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Authors</option>
              {renderAuthors()}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Sources</option>
              <option value="Scopus">Scopus</option>
              <option value="Google Scholar">Google Scholar</option>
              <option value="ORCID">ORCID</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters({ group: '', author: '', source: '' })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
            >
              Reset Filters
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-1/4 border-r border-gray-200 pr-4">
              <h5 className="text-lg font-medium mb-4">Research Groups</h5>
              <ul className="space-y-2 mb-8">
                {Array.isArray(researchGroups) && researchGroups.map(group => (
                  <li
                    key={group.id}
                    className={`p-3 rounded-md cursor-pointer ${filters.group === group.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setFilters(prev => ({ ...prev, group: group.id.toString() }))}
                  >
                    {group.name}
                  </li>
                ))}
              </ul>

              <h5 className="text-lg font-medium mb-4">Authors</h5>
              <ul className="space-y-2">
                {Array.isArray(authors) && authors.map(author => (
                  <li
                    key={author.id}
                    className={`p-3 rounded-md cursor-pointer ${filters.author === author.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setFilters(prev => ({ ...prev, author: author.id.toString() }))}
                  >
                    <div>{author.first_name} {author.last_name}</div>
                    <small className="text-xs">{author.research_group?.name}</small>
                  </li>
                ))}
              </ul>
            </div>

            {/* Publications */}
            <div className="w-full md:w-3/4">
              <h4 className="text-xl font-medium mb-6">Publications</h4>

              {!Array.isArray(publications) || publications.length === 0 ? (
                <p className="text-gray-500">No publications found.</p>
              ) : (
                <div className="space-y-6">
                  {publications.map(publication => (
                    <div key={publication.id} className="bg-white rounded-lg shadow p-6">
                      {publication.url ? (
                        <h5 className="text-lg font-medium mb-2">
                          <a href={publication.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {publication.title}
                          </a>
                        </h5>
                      ) : (
                        <h5 className="text-lg font-medium mb-2">{publication.title}</h5>
                      )}

                      <h6 className="text-sm text-gray-500 mb-3">{publication.publication_date}</h6>
                      <p className="text-gray-700 mb-4">{publication.abstract}</p>

                      <p className="text-sm mb-2">
                        <span className="font-medium">Authors:</span> {publication.authors?.map(a => `${a.first_name} ${a.last_name}`).join(', ')}
                      </p>

                      <p className="text-sm mb-2">
                        <span className="font-medium">Keywords:</span> {publication.keywords}
                      </p>

                      <p className="text-sm">
                        <span className="font-medium">Source:</span> {publication.source}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarDashboard;
