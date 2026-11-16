import { Briefcase, Code2, Users } from "lucide-react";

// Shared look and copy for the three interview tracks used across the app pages.
export const TRACKS = {
  technical: {
    label: "Technical",
    icon: Code2,
    accent: "from-blue-600 to-indigo-600",
    description: "Coding concepts, frameworks, databases and system design.",
  },
  behavioral: {
    label: "Behavioral",
    icon: Users,
    accent: "from-purple-600 to-fuchsia-600",
    description: "Teamwork, leadership and communication, answered with the STAR method.",
  },
  situational: {
    label: "Situational",
    icon: Briefcase,
    accent: "from-orange-500 to-amber-500",
    description: "Workplace scenarios that test judgement and problem-solving.",
  },
};

export const getTrack = (type = "") => {
  const key = decodeURIComponent(String(type)).toLowerCase();
  return (
    TRACKS[key] || {
      label: key ? key.charAt(0).toUpperCase() + key.slice(1) : "Interview",
      icon: Code2,
      accent: "from-slate-600 to-slate-800",
      description: "Interview practice questions.",
    }
  );
};
