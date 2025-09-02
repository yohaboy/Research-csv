import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#1E40AF'];

const TotalPapersPerGroup = () => {
  const [groupData, setGroupData] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPapers, setGroupPapers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState('pie');

  const fetchGroupData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://analytics.ive.center/api/stats/total-papers-per-group/', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      setGroupData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch group data');
      setGroupData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupClick = (groupName, papers) => {
    setSelectedGroup(groupName);
    setGroupPapers(papers);
  };

  const handleExport = async (type) => {
    const endpoint =
      type === 'pdf'
        ? 'http://analytics.ive.center/api/export-papers-per-group-pdf/'
        : 'http://analytics.ive.center/api/export-papers-per-group-excel/';

    const token = localStorage.getItem('token');

    try {
      const response = await axios.get(endpoint, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = new Blob([response.data], {
        type:
          type === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const extension = type === 'pdf' ? 'pdf' : 'xlsx';
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `all_groups_papers.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Failed to export ${type.toUpperCase()}`);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const chartData = Object.entries(groupData).map(([groupName, papers]) => ({
    name: groupName,
    total: papers.length,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Total Papers Per Research Group
          </h1>

          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
            >
              Export All to PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            >
              Export All to Excel
            </button>
          </div>

          <div className="flex justify-center mb-8 space-x-4">
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 font-semibold rounded ${
                chartType === 'pie' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
              } hover:bg-indigo-700 hover:text-white transition`}
            >
              Pie Chart
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-4 py-2 font-semibold rounded ${
                chartType === 'area' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
              } hover:bg-indigo-700 hover:text-white transition`}
            >
              Area Chart
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {!isLoading && !error && chartData.length > 0 && (
            <div className="mb-10 h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#3B82F6"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      onClick={(data) => {
                        const groupName = data.name;
                        const papers = groupData[groupName];
                        handleGroupClick(groupName, papers);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} papers`, 'Total Papers']}
                      contentStyle={{
                        backgroundColor: '#1E40AF',
                        borderRadius: '8px',
                        color: '#fff',
                        border: 'none',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                ) : (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#4B5563', fontWeight: '600' }}
                      tickLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#4B5563', fontWeight: '600' }}
                      tickLine={false}
                      domain={[0, 'dataMax + 1']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E40AF',
                        borderRadius: '8px',
                        color: '#fff',
                        border: 'none',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      animationDuration={800}
                      onClick={(data) => {
                        const groupName = data.name;
                        const papers = groupData[groupName];
                        handleGroupClick(groupName, papers);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 shadow-md rounded-md overflow-hidden">
              <thead className="bg-indigo-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Research Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Total Papers
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupData).map(([groupName, papers]) => (
                  <tr
                    key={groupName}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => handleGroupClick(groupName, papers)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {papers.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedGroup && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Papers for: {selectedGroup}
              </h2>

              {groupPapers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white border border-gray-300 rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-black mb-3">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">Date:</span>{' '}
                        {new Date(paper.publication_date).toLocaleDateString()}
                      </p>
                      {paper.keywords && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-semibold">Keywords:</span> {paper.keywords}
                        </p>
                      )}
                      {paper.abstract && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">Abstract:</span>{' '}
                          {paper.abstract.substring(0, 120)}...
                        </p>
                      )}
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-indigo-600 hover:text-indigo-900 underline font-medium"
                        >
                          View Publication
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded shadow">
                  <p className="text-indigo-900 font-semibold">No papers found for this group.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalPapersPerGroup;
