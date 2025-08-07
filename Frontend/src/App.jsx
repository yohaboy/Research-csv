import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import NavBar from './components/NavBar';
import AuthorDetails from './pages/Authors';
import FileUpload from './pages/Upload';
import ScholarDashboard from './pages/Dashbord';
import Dashboard from './pages/IndexD';
import ReportsDashboard from './pages/Wrapper';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/author-details" element={<AuthorDetails />} />
            <Route path="/upload-csv" element={<FileUpload />} />
            <Route path="/scholar-dashboard" element={<ScholarDashboard />} />

            {/* ✅ Single route to replace all /report-* routes */}
            <Route path="/reports" element={<ReportsDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
