import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import PopupManager from "./components/PopupManager";
import { useAnalyticsTracker } from "./hooks/useAnalytics";

function AnalyticsTracker() {
  useAnalyticsTracker();
  return null;
}

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Blogs = lazy(() => import("./pages/Blogs").then((m) => ({ default: m.Blogs })));
const BlogDetail = lazy(() => import("./pages/Blogs").then((m) => ({ default: m.BlogDetail })));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const ExperienceImmersive = lazy(() => import("./pages/ExperienceImmersive"));
const TeamList = lazy(() => import("./pages/TeamList"));
const TeamMember = lazy(() => import("./pages/TeamMember"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const DeveloperAdmin = lazy(() => import("./pages/admin/DeveloperAdmin"));
const OwnerAdmin = lazy(() => import("./pages/admin/OwnerAdmin"));
const StaffAdmin = lazy(() => import("./pages/admin/StaffAdmin"));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-[var(--muted)]">
      Loading...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnalyticsTracker />
        <PopupManager />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/experience-immersive" element={<ExperienceImmersive />} />
              <Route path="/team" element={<TeamList />} />
              <Route path="/team/:id" element={<TeamMember />} />
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/developer"
                element={
                  <ProtectedRoute roles={["developer"]}>
                    <DeveloperAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/owner"
                element={
                  <ProtectedRoute roles={["owner"]}>
                    <OwnerAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute roles={["staff"]}>
                    <StaffAdmin />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


