import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'; 

const NewPublicationsCount = () => {
  const [sinceDate, setSinceDate] = useState('');
  const [count, setCount] = useState(null);
  const [papers, setPapers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNewPublications = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/stats/new-papers/', {
        params: { since: date },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      setCount(response.data.count);
      setPapers(response.data.papers);
      generateChartData(response.data.papers);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch new publications');
      setCount(null);
      setPapers([]);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateChartData = (papers) => {
    const counts = {};

    papers.forEach(paper => {
      const date = format(new Date(paper.publication_date), 'yyyy-MM-dd');
      counts[date] = (counts[date] || 0) + 1;
    });

    const data = Object.entries(counts)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ date, count }));

    setChartData(data);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sinceDate) {
      setError("Please enter a date");
      return;
    }
    fetchNewPublications(sinceDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            New Papers Since Date
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="since" className="block text-sm font-medium text-gray-700 mb-1">
                Since date (YYYY-MM-DD):
              </label>
              <input
                type="text"
                id="since"
                name="since"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 2023-01-01"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Show'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {count !== null && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700 text-center">
                Number of new papers since {sinceDate}: <strong>{count}</strong>
              </p>
            </div>
          )}

          {/* Chart Section */}
          {chartData.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
                Publications Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Paper Cards */}
          {papers.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {papers.map((paper) => (
                <div key={paper.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{paper.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Date:</span> {format(new Date(paper.publication_date), 'MMMM d, yyyy')}
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
          ) : count === 0 && (
            <div className="mt-4 bg-gray-50 border-l-4 border-gray-400 p-4">
              <p className="text-sm text-gray-700 text-center">No new papers found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPublicationsCount;
