// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-white text-lg font-semibold mb-4">SmartHire</h3>
        <p className="text-sm mb-6">
          AI-powered interview preparation to help you land your dream job.
        </p>
        <div className="flex justify-center gap-6 mb-6">
          {["Home", "Features", "Practice","Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-white transition"
            >
              {item}
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} SmartHire. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
