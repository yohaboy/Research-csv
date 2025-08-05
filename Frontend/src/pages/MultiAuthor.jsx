import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GroupAuthorMultiGroup = () => {
  const [groupData, setGroupData] = useState({});
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorPapers, setAuthorPapers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGroupData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/stats/group-author-multi-group/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      setGroupData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch group data');
      setGroupData({});
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthorPapers = async (authorName) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/publications/', {
        params: {
          author__name: authorName,
          multi_group: true
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      setAuthorPapers(response.data);
      setSelectedAuthor(authorName);
    } catch (err) {
      setError(`Failed to fetch papers for author: ${authorName}`);
      setAuthorPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Authors and Multi-Group Paper Counts by Research Group
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

          {Object.entries(groupData).map(([groupName, authors]) => (
            <div key={groupName} className="mb-8">
              <h2 className="text-xl font-semibold text-blue-600 mb-3">{groupName}</h2>
              
              {Object.keys(authors).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(authors).map(([authorName, paperCount]) => (
                    <li 
                      key={authorName}
                      className="bg-blue-50 hover:bg-blue-100 rounded-lg p-3 cursor-pointer transition-colors"
                      onClick={() => fetchAuthorPapers(authorName)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{authorName}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {paperCount} multi-group paper{paperCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-gray-50 text-gray-600 rounded-lg p-3">
                  No authors with multi-group papers
                </div>
              )}
            </div>
          ))}

          {selectedAuthor && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Multi-Group Papers for: {selectedAuthor}
              </h2>
              
              {authorPapers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {authorPapers.map((paper) => (
                    <div key={paper.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{paper.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date:</span> {new Date(paper.publication_date).toLocaleDateString()}
                      </p>
                      {paper.keywords && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Keywords:</span> {paper.keywords}
                        </p>
                      )}
                      {paper.abstract && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Abstract:</span> {paper.abstract.substring(0, 100)}...
                        </p>
                      )}
                      {paper.url && (
                        <a 
                          href={paper.url} 
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
              ) : (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                  <p className="text-gray-700">No multi-group papers found for this author.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupAuthorMultiGroup;