import { Routes, Route } from "react-router-dom";

import Navbar from "./layout/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Practice from "./components/Practice";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./layout/Footer";

import ProtectedRoute from "./routes/ProtectedRoute";
import PracticeSession from "./pages/PracticeSession";
import ConfigurePractice from "./pages/ConfigurePractice";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

import MockInterview from "./pages/MockInterview";

export default function App() {
  return (
    <Routes>
      {/* Homepage */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Hero />
            <Features />
            <Practice />
            <Testimonials />
            <Contact />
            <Footer />
          </>
        }
      />

      {/* Auth */}
      <Route path="/login" element={<Auth type="login" />} />
      <Route path="/signup" element={<Auth type="signup" />} />

      {/* Dashboard (PROTECTED) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Practice Session (PROTECTED) */}
      <Route
        path="/practice/:type"
        element={
          <ProtectedRoute>
            <PracticeSession />
          </ProtectedRoute>
        }
      />

      {/* Configure Practice (PROTECTED) */}
      <Route
        path="/practice/:type/configure"
        element={
          <ProtectedRoute>
            <ConfigurePractice />
          </ProtectedRoute>
        }
      />

      
<Route
  path="/mock-interview/:type"
  element={<MockInterview />}
/>
    </Routes>
  );
}
