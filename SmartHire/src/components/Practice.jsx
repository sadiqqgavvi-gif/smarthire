import { Code, Users, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const practiceAreas = [
  {
    icon: <Code className="text-blue-600 w-5 h-5 dark:text-blue-400" />,
    title: "Technical",
    desc: "Coding, product sense & system design drills",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/15",
  },
  {
    icon: <Users className="text-purple-600 w-5 h-5 dark:text-purple-400" />,
    title: "Behavioral",
    desc: "STAR responses, teamwork & communication skills",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/15",
  },
  {
    icon: <Briefcase className="text-orange-600 w-5 h-5 dark:text-orange-400" />,
    title: "Situational",
    desc: "Real-world scenarios & decision-making questions",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-500/15",
  },
];

export default function Practice() {
  const navigate = useNavigate();

  return (
    <section
      id="practice"
      className="py-20 px-4 bg-gray-50 scroll-mt-24 dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Start Practicing Now</h2>
          <p className="text-gray-600 mt-4 dark:text-slate-400">
            Select an interview category to begin a focused practice session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {practiceAreas.map((area) => (
            <button
              key={area.title}
              onClick={() =>
                navigate(`/practice/${area.title.toLowerCase()}/configure`)
              }
              className="text-left bg-white p-6 rounded-xl shadow hover:shadow-xl transition dark:bg-slate-900 dark:ring-1 dark:ring-slate-800"
            >
              <div
                className={`w-10 h-10 ${area.bg} rounded-lg flex items-center justify-center mb-4`}
              >
                {area.icon}
              </div>

              <h3 className="font-bold text-lg">{area.title}</h3>
              <p className="text-gray-600 text-sm mb-3 dark:text-slate-400">
                {area.desc}
              </p>

              <span className={`${area.color} font-medium text-sm`}>
                Start Practice →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
