import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import AuthorDetails from './pages/Authors';
import NavBar from './components/NavBar';
import NewPublicationsCount from './pages/NewPub';
import KeywordCounts from './pages/Keyword';
import MultiGroupPapersCount from './pages/MultiGroup';
import GroupAuthorMultiGroup from './pages/MultiAuthor';
import TotalPapersPerGroup from './pages/TotalPPG';
import KeywordCountsPerGroup from './pages/KeywordPG';
import FileUpload from './pages/Upload';
import ScholarDashboard from './pages/Dashbord';
import Dashboard from './pages/IndexD';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/author-details" element={<AuthorDetails />} />
            <Route path="/report-new-papers" element={<NewPublicationsCount />} />
            <Route path="/report-keyword-counts" element={<KeywordCounts />} />
            <Route path="/report-multi-group-papers" element={<MultiGroupPapersCount />} />
            <Route path="/report-group-author-multi-group" element={<GroupAuthorMultiGroup />} />
            <Route path="/report-total-papers-per-group" element={<TotalPapersPerGroup />} />
            <Route path="/report-keyword-counts-per-group" element={<KeywordCountsPerGroup />} />
            <Route path="/upload-csv" element={<FileUpload />} />
            <Route path="/scholar-dashboard" element={<ScholarDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;