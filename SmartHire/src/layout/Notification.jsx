// src/components/Notification.jsx
import { useEffect, useState } from "react";

export default function Notification({ message, duration = 3000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  return (
    <div
      className={`fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-transform duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
