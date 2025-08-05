import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MultiGroupPapersCount = () => {
  const [count, setCount] = useState(null);
  const [publications, setPublications] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMultiGroupPapers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/stats/multi-group-papers/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      setCount(response.data.count);
      setPublications(response.data.publications);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch multi-group papers');
      setCount(null);
      setPublications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMultiGroupPapers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Multi-Group Paper Count
          </h1>
          
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {count !== null && (
            <div className="inline-block bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
              <p className="text-blue-700">
                Number of papers involving two or more research groups: <strong>{count}</strong>
              </p>
            </div>
          )}

          {publications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publications.map((pub) => (
                <div key={pub.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{pub.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Date:</span> {new Date(pub.publication_date).toLocaleDateString()}
                  </p>
                  {pub.keywords && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Keywords:</span> {pub.keywords}
                    </p>
                  )}
                  {pub.abstract && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Abstract:</span> {pub.abstract.substring(0, 100)}...
                    </p>
                  )}
                  {pub.url && (
                    <a 
                      href={pub.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Publication
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : count === 0 && (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
              <p className="text-gray-700">No multi-group papers found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiGroupPapersCount;