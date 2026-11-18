import { matchPath } from "react-router-dom";

export const DEFAULT_TITLE = "SmartHire – AI Interview Practice with Instant Feedback";

const trackLabel = (type = "") => {
  const name = decodeURIComponent(String(type)).toLowerCase();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Interview";
};

// Most specific patterns first; a path that matches none of them is the 404 page.
const ROUTE_TITLES = [
  ["/", () => DEFAULT_TITLE],
  ["/login", () => "Log in"],
  ["/signup", () => "Create your account"],
  ["/dashboard", () => "Dashboard"],
  ["/practice/:type/configure", ({ type }) => `Set up ${trackLabel(type)} practice`],
  ["/practice/:type", ({ type }) => `${trackLabel(type)} practice session`],
  ["/mock-interview/:type", ({ type }) => `${trackLabel(type)} mock interview`],
];

export const getDocumentTitle = (pathname) => {
  for (const [pattern, build] of ROUTE_TITLES) {
    const match = matchPath({ path: pattern, end: true }, pathname);
    if (match) {
      const title = build(match.params);
      return title === DEFAULT_TITLE ? title : `${title} · SmartHire`;
    }
  }
  return "Page not found · SmartHire";
};
