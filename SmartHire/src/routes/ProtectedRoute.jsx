import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);

        if (!isMounted) return;

        if (res.ok) {
          setIsAuthorized(true);
        } else {
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
  }, [API_BASE_URL]);

  if (isChecking) {
    return <div className="p-6 text-gray-500">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
