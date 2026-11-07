import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import ThemeToggle from "../components/ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
        if (!isMounted) return;
        setIsAuthenticated(res.ok);
      } catch {
        if (!isMounted) return;
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setIsAuthenticated(false);
      setMenuOpen(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50 dark:bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            SmartHire
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 text-sm font-medium">

            {/* These use anchor links (scrolling) */}
            <a href="#home" className="text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 ">
              Home
            </a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              Features
            </a>
            <a href="#practice" className="text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              Practice
            </a>
        
            <a href="#contact" className="text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              Contact
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 "
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Register Here
                </Link>
              </>
            )}
          </div>

          {/* Mobile Theme + Menu Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="bg-gray-100 p-2 rounded-md dark:bg-slate-800"
              onClick={toggleMenu}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t dark:bg-slate-900">
          <div className="flex flex-col px-4 py-3 space-y-2">

            {/* Scroll section links */}
            <a
              href="#home"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#features"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#practice"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(false)}
            >
              Practice
            </a>

            <a
              href="#contact"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>

            {/* Mobile Login/Register */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </div>
      )}
    </nav>
  );
}
