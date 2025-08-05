import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const AuthorDetails = () => {
  const [authors, setAuthors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fetch authors from API
  useEffect(() => {
    const fetchAuthors = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token'); // Assuming you store JWT token
        const response = await axios.get('http://127.0.0.1:8000/api/authors/', {
          params: { search: searchQuery },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        setAuthors(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch authors. Please try again.');
        console.error('Error fetching authors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthors();
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The search is already handled by the useEffect hook
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Author Details</h1>
        
        {/* Search Container */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
            <div className="flex-grow">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Authors
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by first name or last name..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Authors List */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.length > 0 ? (
              authors.map((author) => (
                <div key={author.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-1">
                      {author.first_name} {author.last_name}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H5a1 1 0 010-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      {author.research_group?.name || 'No research group'}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Research IDs:</p>
                      <div className="space-y-2">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${author.scopus_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                          </svg>
                          {author.scopus_id ? (
                            <a href={`https://www.scopus.com/authid/detail.uri?authorId=${author.scopus_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Scopus: {author.scopus_id}
                            </a>
                          ) : 'Scopus: Not available'}
                        </div>
                        
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${author.scholar_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                          </svg>
                          {author.scholar_id ? (
                            <a href={`https://scholar.google.com/citations?user=${author.scholar_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Scholar: {author.scholar_id}
                            </a>
                          ) : 'Scholar: Not available'}
                        </div>
                        
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${author.orcid_id ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {author.orcid_id ? (
                            <a href={`https://orcid.org/${author.orcid_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              ORCID: {author.orcid_id}
                            </a>
                          ) : 'ORCID: Not available'}
                        </div>
                      </div>
                    </div>
                    
                    {author.staff_url && (
                      <div className="mt-4">
                        <a 
                          href={author.staff_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-green-600 hover:text-green-800 hover:underline"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          Staff Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No authors found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        {authors.length > 0 && (
          <div className="mt-6 text-center text-gray-500">
            Showing {authors.length} author{authors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorDetails;