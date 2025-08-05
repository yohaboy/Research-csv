import './index.css';
import AuthorDetails from './pages/Authors';
import NavBar from './components/NavBar';
import NewPublicationsCount from './pages/NewPub';
import KeywordCounts from './pages/Keyword';
import MultiGroupPapersCount from './pages/MultiGroup';

function App() {
  return (
    <div>
      <NavBar />
      <AuthorDetails />
      <NewPublicationsCount />
      <KeywordCounts />
      <MultiGroupPapersCount />
    </div>
  );
}

export default App;