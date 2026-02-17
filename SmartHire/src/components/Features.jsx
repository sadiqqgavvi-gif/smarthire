// src/components/Features.jsx
import { Mic, BarChart2, Book } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Mic className="text-blue-600 w-6 h-6" />,
      title: "Mock Interviews",
      text: "Practice with AI that asks real interview questions and evaluates your responses in real-time.",
      // button: { label: "Try now →", color: "text-blue-600" },
    },
    {
      icon: <BarChart2 className="text-purple-600 w-6 h-6" />,
      title: "Performance Analysis",
      text: "Get detailed feedback on your speaking pace, word choice, confidence level, and more.",
      // button: { label: "Learn more →", color: "text-purple-600" },
    },
    {
      icon: <Book className="text-blue-600 w-6 h-6" />,
      title: "Company-Specific Prep",
      text: "Access tailored questions and insights for over 5,000 companies worldwide.",
      // button: { label: "Explore →", color: "text-blue-600" },
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">
            How SmartHire Helps You Succeed
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Our AI-powered platform provides comprehensive tools to prepare you for any interview scenario.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-xl p-8 transition-transform duration-200 hover:shadow-lg hover:scale-105 cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
              <p className="text-gray-600 mb-4">{f.text}</p>
              {f.button ? (
                <button
                  className={`${f.button.color} font-medium hover:underline`}
                >
                  {f.button.label}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
