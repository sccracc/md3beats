import { Instagram, Music2, Twitter } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import AudioVisualizer from "./AudioVisualizer";

const socials = [
  {
    icon: Instagram,
    name: "Instagram",
    handle: "@MD3Beats",
    tagline: "Behind the boards & in the booth.",
    link: "https://www.instagram.com/md3beats",
  },
  {
    icon: Music2,
    name: "TikTok",
    handle: "@MD3Beats",
    tagline: "Short clips. Big sounds.",
    link: "https://www.tiktok.com/@md3beats?is_from_webapp=1&sender_device=pc",
  },
  {
    icon: Twitter,
    name: "X",
    handle: "@MD3Beats",
    tagline: "Thoughts between sessions.",
    link: "https://x.com/md3beats?s=11",
  },
];

export default function Socials() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen px-5 pb-24 pt-32 md:px-12 md:pt-40 lg:px-16">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[18%] -z-10 -translate-x-1/2 select-none text-[clamp(5rem,18vw,16rem)] font-black uppercase tracking-tighter text-white/[0.025]"
        animate={reducedMotion ? {} : { x: ["-50%", "-48%", "-50%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        SOCIALS
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.65 }}
        className="mx-auto max-w-[1120px]"
      >
        <div className="mb-12 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.36em] text-electric-blue">
            <span className="h-px w-8 bg-electric-blue/60" aria-hidden="true" />
            Ecosystem
          </div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter">
            Connect with <span className="text-electric-blue electric-glow">MD3Beats</span>
          </h1>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: reducedMotion ? 0 : 0.08 },
            },
          }}
          className="space-y-4"
        >
          {socials.map((social) => (
            <motion.a
              key={social.name}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              variants={{
                hidden: { opacity: 0, x: 24 },
                show: { opacity: 1, x: 0 },
              }}
              transition={{ duration: reducedMotion ? 0 : 0.5 }}
              whileHover={reducedMotion ? {} : { y: -2 }}
              className="clean-panel kinetic-border group grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-4 border-l-[3px] border-l-transparent p-4 outline-none transition-all duration-300 hover:border-l-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black md:grid-cols-[72px_minmax(0,1fr)_auto] md:gap-6 md:p-6"
            >
              <div className="grid h-[60px] w-[60px] place-items-center rounded-2xl border border-electric-blue/20 bg-electric-blue/10 text-electric-blue shadow-[inset_0_0_28px_rgba(0,209,255,0.08)] transition group-hover:scale-105 group-hover:rotate-3 md:h-[72px] md:w-[72px]">
                <social.icon size={26} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white transition group-hover:text-electric-blue md:text-4xl">
                  {social.name}
                </h2>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 md:text-xs">
                  {social.handle}
                </p>
                <p className="mt-3 text-sm text-white/55 md:text-base">{social.tagline}</p>
              </div>

              <div className="font-display text-4xl text-white/25 transition duration-300 group-hover:translate-x-2 group-hover:text-electric-blue md:text-6xl">
                -&gt;
              </div>
            </motion.a>
          ))}
        </motion.div>

        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-electric-blue/40 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-white/42">All socials @MD3Beats</p>
          <div className="w-full max-w-[260px] opacity-70">
            <AudioVisualizer size="sm" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
