import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const tabs = [
  { label: "HOME", path: "/" },
  { label: "NEWS", path: "/news" },
  { label: "SOCIALS", path: "/socials" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <motion.div aria-hidden="true" className="fixed left-0 top-0 z-[70] h-px bg-electric-blue shadow-[0_0_16px_rgba(0,209,255,0.9)]" style={{ width: progressWidth }} />

      <motion.nav
        animate={{
          backgroundColor: isScrolled ? "rgba(5,5,8,0.8)" : "rgba(5,5,8,0)",
          borderColor: isScrolled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0)",
        }}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className="fixed left-0 right-0 top-0 z-[60] border-b px-5 py-5 backdrop-blur-none transition-[backdrop-filter] duration-300 md:px-12 lg:px-16"
        style={{ backdropFilter: isScrolled ? "blur(32px)" : "blur(0px)" }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link
            to="/"
            onClick={closeMenu}
            className="group flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
            aria-label="Go to home"
          >
            <span className="orbital-dot relative grid h-10 w-10 place-items-center rounded-full border border-electric-blue/30 text-sm font-black tracking-tighter text-white">
              <motion.span
                aria-hidden="true"
                className="absolute inset-[-5px] rounded-full border border-electric-blue/25"
                animate={reducedMotion ? {} : { scale: [1, 1.16, 1], opacity: [0.35, 0.05, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              MD3
            </span>
            <span className="text-shine text-xl font-black tracking-tighter">
              MD3<span className="text-electric-blue electric-glow">BEATS</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={closeMenu}
                  className={`kinetic-border group relative rounded-full border px-5 py-2.5 text-[11px] font-bold tracking-[0.22em] outline-none transition-all focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black ${
                    isActive
                      ? "border-electric-blue/40 bg-electric-blue/10 text-electric-blue"
                      : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full bg-electric-blue align-middle shadow-[0_0_12px_rgba(0,209,255,0.95)] transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            className="fixed inset-0 z-50 grid place-items-center bg-brand-black/95 px-6 backdrop-blur-2xl md:hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reducedMotion ? 0 : 0.08 } },
              }}
              className="flex w-full flex-col items-center gap-7"
            >
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.path}
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reducedMotion ? 0 : 0.45 }}
                >
                  <Link
                    to={tab.path}
                    onClick={closeMenu}
                    className={`font-display text-[clamp(2.4rem,12vw,5.5rem)] font-bold tracking-tighter outline-none focus-visible:ring-2 focus-visible:ring-electric-blue ${
                      location.pathname === tab.path ? "text-electric-blue" : "text-white"
                    }`}
                  >
                    <span className="mr-4 align-middle text-sm font-sans font-bold tracking-[0.35em] text-white/30">0{index + 1}</span>
                    {tab.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
