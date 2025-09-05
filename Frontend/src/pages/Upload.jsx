import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessages([{ text: 'No file provided.', type: 'error' }]);
      return;
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv') && !filename.endsWith('.xls') && !filename.endsWith('.xlsx')) {
      setMessages([{ text: 'File must be .csv, .xls, or .xlsx format.', type: 'error' }]);
      return;
    }

    setIsProcessing(true);
    setStatus('File upload started...');
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await axios.post('http://analytics.ive.center/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.data.error) {
        setMessages([{ text: response.data.error, type: 'error' }]);
        setStatus('');
      } else {
        setStatus(response.data.message);
        setTaskId(response.data.task_id);
      }
    } catch (error) {
      setMessages([{ text: `Error processing file: ${error.message}`, type: 'error' }]);
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearData = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to clear ALL data from the database? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post('http://analytics.ive.center/api/upload/', { clear_data: true });
      setMessages([{ text: response.data.message, type: 'success' }]);
    } catch (error) {
      setMessages([{ text: `Error clearing data: ${error.message}`, type: 'error' }]);
    }
  };

  // const pollTaskStatus = async (taskId) => {
  //   const interval = setInterval(async () => {
  //     try {
  //       const response = await axios.get(`/check_csv_task_status/?task_id=${taskId}`);
  //       if (response.data.ready) {
  //         clearInterval(interval);
  //         setStatus('Processing finished!');
  //       }
  //     } catch (error) {
  //       clearInterval(interval);
  //       setMessages([{ text: 'Error checking task status.', type: 'error' }]);
  //     }
  //   }, 2000);
  // };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-7">Upload CSV</h1>
      
      {messages.length > 0 && (
        <ul className="mb-6">
          {messages.map((message, index) => (
            <li 
              key={index} 
              className={`p-3 rounded-lg mb-2 text-sm ${
                message.type === 'error' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {message.text}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept=".csv,.xls,.xlsx" 
          required 
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button 
          type="submit" 
          disabled={isProcessing}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Process CSV'}
        </button>
      </form>

      <form onSubmit={handleClearData} className="mt-5">
        <button 
          type="submit" 
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          Clear All Data
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-lg">
          {status}
        </div>
      )}

      <a 
        href="/" 
        className="block mt-6 text-center py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
      >
        Back to Dashboard
      </a>
    </div>
  );
};

export default FileUpload;