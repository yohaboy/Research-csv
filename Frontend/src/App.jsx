import AuthorDetails from './pages/Authors';
import NavBar from './components/NavBar';
import './index.css';
import NewPublicationsCount from './pages/NewPub';

function App() {
  return (
    <div>
      <NavBar />
      <AuthorDetails />
      <NewPublicationsCount />
    </div>
  );
}

export default App;