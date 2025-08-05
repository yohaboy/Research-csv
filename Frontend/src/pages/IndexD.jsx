import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    authors_count: 0,
    publications_count: 0,
    research_groups_count: 0,
    author_publications_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/index/');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const featureCards = [
    {
      title: 'Upload CSV',
      icon: 'bi-upload',
      description: 'Import author and publication data from CSV files',
      link: '/upload-csv'
    },
    {
      title: 'Publication Dashboard',
      icon: 'bi-journal-text',
      description: 'Browse all publications and research data',
      link: '/scholar-dashboard'
    },
    {
      title: 'Author Details',
      icon: 'bi-people',
      description: 'View detailed author information and IDs',
      link: '/author-details'
    },
    {
      title: 'New Papers Since Date',
      icon: 'bi-calendar-plus',
      description: 'Track recent publications by date range',
      link: '/report-new-papers'
    },
    {
      title: 'Keyword Counts',
      icon: 'bi-tags',
      description: 'Analyze keyword frequency in publications',
      link: '/report-keyword-counts'
    },
    {
      title: 'Multi-Group Paper Count',
      icon: 'bi-diagram-3',
      description: 'Papers with authors from multiple groups',
      link: '/report-multi-group-papers'
    },
    {
      title: 'Group/Author Multi-Group Counts',
      icon: 'bi-person-lines-fill',
      description: 'Detailed collaboration analysis',
      link: '/report-group-author-multi-group'
    },
    {
      title: 'Total Papers Per Group',
      icon: 'bi-bar-chart',
      description: 'Publication counts by research group',
      link: '/report-total-papers-per-group'
    },
    {
      title: 'Keyword Counts Per Group',
      icon: 'bi-pie-chart',
      description: 'Keyword analysis by research group',
      link: '/report-keyword-counts-per-group'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-8">Research Reporting Dashboard</h1>
        
        {/* Quick Stats Row */}
        <div className="bg-gray-100 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-800">
                {loading ? '--' : stats.authors_count}
              </div>
              <div className="text-gray-600 text-sm">Authors</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-800">
                {loading ? '--' : stats.publications_count}
              </div>
              <div className="text-gray-600 text-sm">Publications</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-800">
                {loading ? '--' : stats.research_groups_count}
              </div>
              <div className="text-gray-600 text-sm">Research Groups</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-800">
                {loading ? '--' : stats.author_publications_count}
              </div>
              <div className="text-gray-600 text-sm">Author Publications</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feature, index) => (
            <Link 
              key={index}
              to={feature.link}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="text-center">
                <i className={`bi ${feature.icon} text-4xl text-blue-800 mb-4`}></i>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;