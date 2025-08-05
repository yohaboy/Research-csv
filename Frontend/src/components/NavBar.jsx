import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold text-blue-800">
            Research Dashboard
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link 
              to="/" 
              className={`${location.pathname === '/' ? 'text-blue-800' : 'text-gray-500 hover:text-blue-800'}`}
            >
              Home
            </Link>
            <Link 
              to="/scholar-dashboard" 
              className={`${location.pathname === '/scholar-dashboard' ? 'text-blue-800' : 'text-gray-500 hover:text-blue-800'}`}
            >
              Publication Dashboard
            </Link>
            <Link 
              to="/author-details" 
              className={`${location.pathname === '/author-details' ? 'text-blue-800' : 'text-gray-500 hover:text-blue-800'}`}
            >
              Author Details
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;