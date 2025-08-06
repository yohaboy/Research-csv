import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
  '#f87171', '#fb7185', '#f43f5e', '#e11d48', '#be123c'
];

const GroupAuthorMultiGroupChart = () => {
  const [groupData, setGroupData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'pie'

  useEffect(() => {
    fetchGroupData();
  }, []);

  const fetchGroupData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:8000/api/stats/group-author-multi-group/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = response.data.data || {};
      setGroupData(data);
      const authorsSet = new Set();
      const processed = [];

      Object.entries(data).forEach(([groupName, authors]) => {
        const row = { group: groupName };
        Object.entries(authors).forEach(([author, count]) => {
          row[author] = count;
          authorsSet.add(author);
        });
        processed.push(row);
      });

      setChartData(processed);
      setGroups([...authorsSet]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type) => {
    const token = localStorage.getItem('token');
    const url =
      type === 'excel'
        ? 'http://127.0.0.1:8000/api/export-group-author-multigroup-excel/'
        : 'http://127.0.0.1:8000/api/export-group-author-multigroup-pdf/';

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type:
          type === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `group-author-multigroup.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Export ${type} failed`, error);
    }
  };

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" angle={-45} textAnchor="end" interval={0} height={100} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          {groups.map((author, index) => (
            <Bar
              key={author}
              dataKey={author}
              stackId="a"
              fill={`hsl(${(index * 37) % 360}, 70%, 60%)`}
            />
          ))}
        </BarChart>
      );
    }

    if (chartType === 'pie') {
      const authorTotals = groups
        .map((author) => ({
          name: author,
          value: chartData.reduce((sum, row) => sum + (row[author] || 0), 0),
        }))
        .filter((d) => d.value > 0);

      return (
        <PieChart>
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Pie
            data={authorTotals}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={(entry) => entry.name}
          >
            {authorTotals.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    return null;
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Multi-Group Publication Count per Author by Research Group
      </h2>

      {isLoading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!isLoading && !error && chartData.length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded ${
                chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 rounded ${
                chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Pie Chart
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Export PDF
            </button>
          </div>

          <ResponsiveContainer width="100%" height={500}>
            {renderChart()}
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default GroupAuthorMultiGroupChart;
