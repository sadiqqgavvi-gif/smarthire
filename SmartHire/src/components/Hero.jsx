// src/components/Hero.jsx
export default function Hero() {
  return (
    <section
      id="home"
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-200"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>

      <div className="max-w-7xl mx-auto relative text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered
          </span>{" "}
          Interview Prep
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Practice with our intelligent AI assistant, get personalized feedback, and land your dream job with confidence.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* <button className="px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg">
            Start Free Trial
          </button> */}
          <button className="px-8 py-4 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-lg border border-gray-200 flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-4.586-2.65A1 1 0 009 9.36v5.28a1 1 0 001.166.842l4.586-2.65a1 1 0 000-1.724z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Demo
          </button>
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 rounded-3xl blur-3xl"></div>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Interview Dashboard</h3>
                {/* <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Live Demo</span> */}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Practice Sessions", value: "127" },
                  { label: "Success Rate", value: "94%" },
                  { label: "Avg Rating", value: "4.9" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-3xl font-bold">{item.value}</div>
                    <div className="text-sm opacity-80">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
