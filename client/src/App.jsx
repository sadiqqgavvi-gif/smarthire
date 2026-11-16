import { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

// The landing page is loaded up front; every other page is split into its own
// chunk so first-time visitors only download what the home page needs.
import Navbar from "./layout/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Practice from "./components/Practice";
import FAQ from "./components/FAQ";
import TopicMarquee from "./components/TopicMarquee";
import FinalCTA from "./components/FinalCTA";
import Contact from "./components/Contact";
import Footer from "./layout/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import PageLoader from "./components/app/PageLoader";

const loadAuth = () => import("./pages/Auth");
const Auth = lazy(loadAuth);
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ConfigurePractice = lazy(() => import("./pages/ConfigurePractice"));
const PracticeSession = lazy(() => import("./pages/PracticeSession"));
const MockInterview = lazy(() => import("./pages/MockInterview"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Home() {
  // Most visitors click "Get started" next, so fetch that page while the browser is idle.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() => loadAuth());
    return () => cancel(id);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TopicMarquee />
        <Features />
        <Practice />
        <FAQ />
        <Contact />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/signup" element={<Auth type="signup" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/:type"
          element={
            <ProtectedRoute>
              <PracticeSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/:type/configure"
          element={
            <ProtectedRoute>
              <ConfigurePractice />
            </ProtectedRoute>
          }
        />
        <Route path="/mock-interview/:type" element={<MockInterview />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
