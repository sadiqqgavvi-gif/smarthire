// src/components/Testimonials.jsx
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer at Google",
      text: "SmartHire gave me the confidence I needed for my interviews. The AI feedback was spot on!",
      rating: 4,
    },
    {
      name: "Ali Ahmed",
      role: "Data Analyst at Microsoft",
      text: "The practice sessions felt like real interviews. The detailed analysis helped me improve fast.",
      rating: 5,
    },
    {
      name: "Emma Wilson",
      role: "UX Designer at Amazon",
      text: "A brilliant platform — it's like having a personal coach for interviews!",
      rating: 4,
    },
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl p-8 shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">“{t.text}”</p>
              <h4 className="font-bold text-gray-900">{t.name}</h4>
              <p className="text-sm text-gray-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
