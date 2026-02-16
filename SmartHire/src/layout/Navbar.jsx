import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600">
            SmartHire
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 text-sm font-medium">

            {/* These use anchor links (scrolling) */}
            <a href="#home" className="text-gray-600 hover:text-blue-600 ">
              Home
            </a>
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a href="#practice" className="text-gray-600 hover:text-blue-600">
              Practice
            </a>
        
            <a href="#contact" className="text-gray-600 hover:text-blue-600">
              Contact
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 "
            >
              Login
            </Link>


            <Link
              to="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Register Here
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden bg-gray-100 p-2 rounded-md"
            onClick={toggleMenu}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="flex flex-col px-4 py-3 space-y-2">

            {/* Scroll section links */}
            <a
              href="#home"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#features"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#practice"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Practice
            </a>

            <a
              href="#contact"
              className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>

            {/* Mobile Login/Register */}
            <Link
              to="/login"
              className="text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
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

             <Link
              to="/signup"
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
              onClick={() => setMenuOpen(false)}
            >
              Search
            </Link>

            

          </div>
        </div>
      )}
    </nav>
  );
}
