import { ArrowRight, Instagram, Music2, Twitter } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import AudioVisualizer from "./AudioVisualizer";

interface HomeProps {
  onContactClick: () => void;
  onSocialsClick: () => void;
}

const stats = [
  { value: "500+", label: "Beats Produced" },
  { value: "200+", label: "Artist Collaborations" },
  { value: "NYC", label: "Based" },
];

const platforms = [
  { label: "Instagram", icon: Instagram },
  { label: "TikTok", icon: Music2 },
  { label: "X", icon: Twitter },
];

const tags = ["Hard drums", "Clean mixes", "Custom sound kits"];

export default function Home({ onContactClick, onSocialsClick }: HomeProps) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroLift = useTransform(scrollYProgress, [0, 0.45], [0, -48]);
  const visualLift = useTransform(scrollYProgress, [0, 0.45], [0, 64]);

  return (
    <div className="relative min-h-screen overflow-hidden px-5 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40 lg:px-16">
      <div className="pointer-events-none absolute inset-0 frequency-lines opacity-35" aria-hidden="true" />
      <AudioVisualizer
        className="pointer-events-none absolute bottom-20 left-1/2 w-[760px] max-w-none -translate-x-1/2 opacity-18 md:bottom-10"
        size="lg"
      />
      <motion.div
        aria-hidden="true"
        style={{ y: visualLift }}
        className="orbital-dot pointer-events-none absolute right-[6vw] top-[18vh] hidden h-28 w-28 rounded-full border border-electric-blue/20 lg:block"
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: reducedMotion ? 0 : 0.08 },
          },
        }}
        className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:items-center"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 24 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: reducedMotion ? 0 : 0.8 }}
          style={{ y: heroLift }}
          className="max-w-[920px]"
        >
          <div className="mb-8 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.36em] text-electric-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-blue shadow-[0_0_14px_rgba(0,209,255,0.9)]" aria-hidden="true" />
            Premium Audio Architecture / New York
          </div>

          <h1 className="relative font-display font-black uppercase leading-[0.76] tracking-tighter">
            <motion.span
              aria-hidden="true"
              className="absolute left-[-3%] top-[12%] h-[42%] w-[76%] rounded-full bg-electric-blue/10 blur-[70px]"
              animate={reducedMotion ? {} : { opacity: [0.24, 0.46, 0.24], scale: [1, 1.08, 1] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="block text-[clamp(5rem,16vw,10rem)] text-white">MD3</span>
            <span className="headline-stroke electric-glow block text-[clamp(5rem,16vw,10rem)]">BEATS</span>
            <span className="absolute bottom-[-0.26em] left-[4%] font-serif text-[clamp(2.6rem,7vw,6.5rem)] font-normal italic normal-case tracking-normal text-white/40">
              Production
            </span>
          </h1>

          <p className="mt-20 max-w-3xl text-xs font-semibold uppercase tracking-[0.36em] text-white/50 md:text-sm">
            Sound Design / Mixing / Custom Beats
          </p>

          <div className="mt-8 flex max-w-2xl flex-wrap gap-2">
            {tags.map((label, index) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.45 + index * 0.06 }}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/42"
              >
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.aside
          variants={{
            hidden: { opacity: 0, x: 28 },
            show: { opacity: 1, x: 0 },
          }}
          transition={{ duration: reducedMotion ? 0 : 0.8 }}
          className="clean-panel kinetic-border relative p-5 md:p-7 lg:ml-auto lg:w-full"
          whileHover={reducedMotion ? {} : { y: -2 }}
        >
          <motion.div
            className="absolute right-[-80px] top-[-80px] h-52 w-52 rounded-full border border-electric-blue/15"
            animate={reducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
          />
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-electric-blue">Credentials</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">Built for sessions</h2>
            </div>
            <div className="h-2 w-2 rounded-full bg-electric-blue shadow-[0_0_16px_rgba(0,209,255,0.9)]" />
          </div>

          <div className="grid gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="magnetic-card flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
              >
                <span className="font-display text-3xl font-bold tracking-tighter text-white">{stat.value}</span>
                <span className="text-right text-[10px] font-bold uppercase tracking-[0.24em] text-white/42">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-electric-blue/10 bg-brand-black/35 p-4 shadow-[inset_0_0_38px_rgba(0,209,255,0.035)]">
            <AudioVisualizer size="lg" />
          </div>
        </motion.aside>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.35, duration: reducedMotion ? 0 : 0.7 }}
        className="relative mx-auto mt-14 flex max-w-[1440px] flex-col items-start gap-6 md:mt-20"
      >
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <motion.button
            type="button"
            onClick={onContactClick}
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            className="button-slide kinetic-border rounded-full border border-electric-blue bg-electric-blue px-8 py-4 text-xs font-black uppercase tracking-[0.26em] text-brand-black outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black hover:text-brand-black"
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              Get In Touch <ArrowRight size={16} aria-hidden="true" />
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={onSocialsClick}
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            className="button-slide kinetic-border rounded-full border border-white/15 px-8 py-4 text-xs font-black uppercase tracking-[0.26em] text-white outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black hover:border-electric-blue hover:text-brand-black"
          >
            <span className="relative z-10">Follow on Socials</span>
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.label}
              type="button"
              onClick={onSocialsClick}
              className="magnetic-card inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 outline-none transition hover:border-electric-blue/40 hover:text-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
            >
              <platform.icon size={13} aria-hidden="true" />
              {platform.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
