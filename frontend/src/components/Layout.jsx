import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Intro from "./Intro";
import ScrollFX from "./ScrollFX";

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-[var(--ink)]">
      {!isAdmin && <Intro />}
      {!isAdmin && <ScrollFX />}
      {!isAdmin && <Header />}
      <main>
        <Outlet />
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}
