import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, type Transition, useReducedMotion } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Contact from "./components/Contact";
import CursorGlow from "./components/CursorGlow";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import News from "./components/News";
import Socials from "./components/Socials";
import Toast from "./components/Toast";
import { ToastProvider } from "./hooks/useToast";
import ProtectedRoute from "./pages/ProtectedRoute";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function AmbientBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-[-18%] top-[-20%] h-[62vw] max-h-[780px] min-h-[360px] w-[62vw] min-w-[360px] rounded-full bg-electric-blue opacity-[0.06] blur-[120px]"
        animate={reducedMotion ? {} : { x: [0, 32, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] right-[-12%] h-[48vw] max-h-[640px] min-h-[300px] w-[48vw] min-w-[300px] rounded-full bg-electric-blue opacity-[0.045] blur-[110px]"
        animate={reducedMotion ? {} : { x: [0, -22, 0], y: [0, -34, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 music-staff opacity-55" />
      <div className="absolute inset-0 frequency-lines opacity-45" />
      <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      <div className="absolute inset-0 scanline opacity-[0.045]" />
      <motion.div
        className="absolute left-[-10%] top-[18%] h-px w-[120%] rotate-[-8deg] bg-gradient-to-r from-transparent via-electric-blue/30 to-transparent"
        animate={reducedMotion ? {} : { x: ["-35%", "35%"], opacity: [0, 0.85, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.8 }}
      />

      <motion.svg
        viewBox="0 0 600 600"
        className="absolute right-[-120px] top-[110px] h-[580px] w-[580px] opacity-[0.04] md:right-[2vw] md:top-[100px] md:h-[700px] md:w-[700px]"
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="300" cy="300" r="260" fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="210" fill="none" stroke="white" strokeWidth="0.8" />
        <circle cx="300" cy="300" r="116" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="300" cy="300" r="42" fill="none" stroke="#00D1FF" strokeWidth="1.5" />
        {Array.from({ length: 48 }).map((_, index) => (
          <line key={index} x1="300" y1="58" x2="300" y2="92" stroke="white" strokeWidth="0.8" transform={`rotate(${index * 7.5} 300 300)`} />
        ))}
      </motion.svg>

      <div className="absolute right-[-88px] top-1/2 hidden -translate-y-1/2 rotate-90 lg:block">
        <span className="select-none text-[clamp(5rem,10vw,10rem)] font-black uppercase tracking-[0.18em] text-white/[0.025]">ATMOSPHERE</span>
      </div>
      <div className="absolute left-[-92px] top-[58%] hidden -translate-y-1/2 -rotate-90 lg:block">
        <span className="select-none text-[clamp(4rem,8vw,8.6rem)] font-black uppercase tracking-[0.18em] text-white/[0.022]">PRODUCTION</span>
      </div>
    </div>
  );
}

function LoadingMark() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="clean-panel relative overflow-hidden px-9 py-7">
        <motion.div
          className="text-shine font-display text-3xl font-black tracking-tighter md:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.45 }}
        >
          MD3<span className="text-electric-blue electric-glow">BEATS</span>
        </motion.div>
      </div>
    </div>
  );
}

function RoutedApp() {
  const [isLoading, setIsLoading] = useState(true);
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), reducedMotion ? 50 : 1500);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const focusTransition: Transition = {
    duration: reducedMotion ? 0 : 0.4,
    ease: "easeOut",
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-brand-black text-white">
      <CursorGlow />
      {!isAdminRoute && <AmbientBackground />}
      {!isAdminRoute && <Navbar />}

      <AnimatePresence>
        {isLoading && !isAdminRoute && (
          <motion.div key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.45 }} className="fixed inset-0 z-[90] grid place-items-center bg-brand-black">
            <LoadingMark />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.section
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={focusTransition}
          >
            <Suspense fallback={<LoadingMark />}>
              <Routes location={location}>
                <Route path="/" element={<Home onContactClick={() => navigate("/contact")} onSocialsClick={() => navigate("/socials")} />} />
                <Route path="/news" element={<News />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/socials" element={<Socials />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.section>
        </AnimatePresence>
      </main>

      {location.pathname === "/" && (
        <footer className="relative z-10 border-t border-white/10 bg-brand-black/55 px-5 py-4 backdrop-blur-xl md:px-12 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-3 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 md:grid-cols-4">
            <div className="md:text-left">&copy; 2026 MD3Beats. All Rights Reserved.</div>
            <div className="md:col-span-2">New York / 2026</div>
            <div className="hidden items-center justify-end gap-4 md:flex">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
                className="inline-flex items-center justify-center gap-2 rounded-full text-white/45 outline-none transition hover:text-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
              >
                Back to top <ArrowUp size={14} aria-hidden="true" />
              </button>
              <Link to="/admin" className="text-white/10">ADMIN</Link>
            </div>
          </div>
        </footer>
      )}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <RoutedApp />
      </BrowserRouter>
    </ToastProvider>
  );
}
