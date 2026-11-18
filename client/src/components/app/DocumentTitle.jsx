import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getDocumentTitle } from "../../utils/documentTitle";

// Gives every page its own browser-tab title, so tabs, history and bookmarks are readable.
export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getDocumentTitle(pathname);
  }, [pathname]);

  return null;
}
