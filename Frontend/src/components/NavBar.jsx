function NavBar() {
    return <nav className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <a 
            className="text-blue-800 font-semibold text-xl flex items-center"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
            Research Dashboard
          </a>
        </div>
        <div className="hidden sm:ml-6 sm:flex sm:items-center">
          <div className="flex space-x-4">
            <a
              className="text-gray-500 hover:text-blue-800 px-3 py-2 text-sm font-medium"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </a>
            <a
              className="text-gray-500 hover:text-blue-800 px-3 py-2 text-sm font-medium"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              Scholar Dashboard
            </a>
            <a
              className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Author Details
            </a>
          </div>
        </div>
      </div>
    </div>
    </nav>
}

export default NavBar;