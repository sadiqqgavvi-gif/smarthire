// src/layout/Footer.jsx
import { Link } from "react-router-dom";

const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Practice tracks", href: "#practice" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Practice",
    links: [
      { label: "Technical", to: "/practice/technical/configure" },
      { label: "Behavioral", to: "/practice/behavioral/configure" },
      { label: "Situational", to: "/practice/situational/configure" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Get started", to: "/signup" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

const linkClass = "text-sm text-slate-400 transition hover:text-white";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <a href="#home" className="inline-flex items-center gap-2 text-xl font-bold text-white">
              <img src="/smarthire-logo.svg" alt="" className="h-8 w-8" />
              SmartHire
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6">
              AI-powered interview preparation. Practice real questions, answer by voice or text,
              and get instant feedback to help you land your next role.
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Start practicing free
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link to={link.to} className={linkClass}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={linkClass}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SmartHire. All rights reserved.</p>
          <p>Built to help you prepare, practice and perform.</p>
        </div>
      </div>
    </footer>
  );
}
