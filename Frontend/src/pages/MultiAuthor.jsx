import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const GroupAuthorMultiGroupChart = () => {
  const [groupData, setGroupData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

      const data = response.data.data || {};
      setGroupData(data);
      const authorsSet = new Set();
      const processed = [];

      // Transform into chart data format
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

  useEffect(() => {
    fetchGroupData();
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Multi-Group Publication Count per Author by Research Group
      </h2>

      {isLoading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!isLoading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="group" angle={-45} textAnchor="end" interval={0} height={100} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            {groups.map((author, index) => (
              <Bar key={author} dataKey={author} stackId="a" fill={`hsl(${index * 37 % 360}, 70%, 60%)`} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GroupAuthorMultiGroupChart;
