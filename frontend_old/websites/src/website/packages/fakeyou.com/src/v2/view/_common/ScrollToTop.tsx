import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const [prevPath, setPrevPath] = useState("");

  useEffect(() => {
    const fullPathWithoutSearch = pathname;
    const prevFullPathWithoutSearch = prevPath;
    if (fullPathWithoutSearch !== prevFullPathWithoutSearch) {
      window.scrollTo(0, 0);
    }

    setPrevPath(fullPathWithoutSearch);
  }, [pathname, prevPath, search]);

  return null;
}
