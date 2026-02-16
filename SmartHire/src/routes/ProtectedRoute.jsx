import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const token = localStorage.getItem("token");
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      if (!token) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthorized(false);
        }
      } catch {
        if (!isMounted) return;
        setIsAuthorized(false);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [token, API_BASE_URL]);

  if (isChecking) {
    return <div className="p-6 text-gray-500">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
