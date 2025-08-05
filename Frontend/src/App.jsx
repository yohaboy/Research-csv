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

function App() {
  return (
    <div>
      <NavBar />
      <AuthorDetails />
      <NewPublicationsCount />
      <KeywordCounts />
      <MultiGroupPapersCount />
      <GroupAuthorMultiGroup />
      <TotalPapersPerGroup />
      <KeywordCountsPerGroup />
      <FileUpload />
      <ScholarDashboard />
    </div>
  );
}

export default App;