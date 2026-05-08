import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Check, Copy, Loader2, Mail, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useId, useState } from "react";
import AudioVisualizer from "./AudioVisualizer";
import { db, handleFirestoreError } from "../lib/firebase";

type InquiryType = "collab" | "beat" | "business" | "other";

interface FormData {
  name: string;
  email: string;
  type: InquiryType;
  message: string;
}

const inquiryTypes: Array<{ value: InquiryType; label: string }> = [
  { value: "collab", label: "Collab" },
  { value: "beat", label: "Custom Beat" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

const initialFormData: FormData = {
  name: "",
  email: "",
  type: "collab",
  message: "",
};

interface FloatingFieldProps {
  label: string;
  value: string;
  type?: "text" | "email";
  required?: boolean;
  onChange: (value: string) => void;
}

function FloatingInput({ label, value, type = "text", required = false, onChange }: FloatingFieldProps) {
  const id = useId();

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder=" "
        className="peer w-full border-0 border-b border-white/15 bg-transparent px-0 pb-3 pt-7 text-base text-white outline-none transition focus:border-electric-blue focus:ring-0"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-7 text-xs font-bold uppercase tracking-[0.26em] text-white/36 transition-all duration-200 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-electric-blue peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px]"
      >
        {label}
      </label>
    </div>
  );
}

interface FloatingTextareaProps {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function FloatingTextarea({ label, value, required = false, onChange }: FloatingTextareaProps) {
  const id = useId();

  return (
    <div className="relative">
      <textarea
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder=" "
        rows={6}
        className="peer w-full resize-none border-0 border-b border-white/15 bg-transparent px-0 pb-3 pt-7 text-base text-white outline-none transition focus:border-electric-blue focus:ring-0"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-7 text-xs font-bold uppercase tracking-[0.26em] text-white/36 transition-all duration-200 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-electric-blue peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px]"
      >
        {label}
      </label>
    </div>
  );
}

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const reducedMotion = useReducedMotion();
  const email = "manager@md3beats.com";

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const updateFormData = <Field extends keyof FormData>(field: Field, value: FormData[Field]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "new",
      });
      setIsSuccess(true);
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
      setError("Failed to send inquiry. Please try again or contact via email directly.");
      handleFirestoreError(err, "create", "inquiries");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen px-5 pb-24 pt-32 md:px-12 md:pt-40 lg:px-16">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-4vw] top-[16%] -z-10 hidden select-none text-[clamp(5rem,15vw,14rem)] font-black uppercase tracking-tighter text-white/[0.022] lg:block"
        animate={reducedMotion ? {} : { y: [0, 18, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        CONTACT
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.65 }}
        className="mx-auto max-w-[1280px]"
      >
        <div className="mb-12 max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.36em] text-electric-blue">
            <span className="h-px w-8 bg-electric-blue/60" aria-hidden="true" />
            Booking & Collaborations
          </div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter">
            Work with <span className="text-electric-blue electric-glow">MD3Beats</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <motion.aside
            whileHover={reducedMotion ? {} : { y: -2 }}
            className="clean-panel kinetic-border relative p-6 md:p-8"
          >
            <motion.div
              className="absolute right-[-90px] top-[-90px] h-56 w-56 rounded-full border border-electric-blue/15"
              animate={reducedMotion ? {} : { rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl border border-electric-blue/25 bg-electric-blue/10 text-electric-blue">
              <Mail size={24} aria-hidden="true" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/36">Primary contact</p>
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-brand-black/35 p-4">
              <p className="break-all font-mono text-sm text-white/78 md:text-base">{email}</p>
              <button
                type="button"
                onClick={copyEmail}
                className="magnetic-card inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/60 outline-none transition hover:border-electric-blue/40 hover:text-electric-blue focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? "Copied" : "Copy Email"}
              </button>
            </div>

            <p className="mt-8 text-sm leading-7 text-white/54">
              Send the context that matters: artist name, timeline, reference mood, and what the record needs to become.
            </p>
            <blockquote className="mt-8 font-serif text-2xl italic leading-tight text-white/42">
              "Every great track starts with a single conversation."
            </blockquote>

            <div className="mt-10 max-w-[240px] opacity-70">
              <AudioVisualizer size="sm" />
            </div>
          </motion.aside>

          <section className="clean-panel p-6 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                  transition={{ duration: reducedMotion ? 0 : 0.45 }}
                  className="grid min-h-[520px] place-items-center text-center"
                >
                  <div>
                    <div className="ripple-ring relative mx-auto mb-9 grid h-20 w-20 place-items-center rounded-full border border-electric-blue/35 bg-electric-blue/10 text-electric-blue">
                      <Check size={34} aria-hidden="true" />
                    </div>
                    <h2 className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-black leading-none tracking-tighter">
                      Inquiry Received
                    </h2>
                    <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50 md:text-base">
                      Thanks for reaching out. MD3Beats will respond within 24-48 hours for booking, production, and business inquiries.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSuccess(false)}
                      className="mt-9 rounded-full border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-electric-blue outline-none transition hover:border-electric-blue/40 hover:bg-electric-blue/10 focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
                    >
                      Send another message
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25 }}
                  className="grid gap-8"
                >
                  <div className="grid gap-8 md:grid-cols-2">
                    <FloatingInput
                      label="Name / Artist Name"
                      value={formData.name}
                      required
                      onChange={(value) => updateFormData("name", value)}
                    />
                    <FloatingInput
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      required
                      onChange={(value) => updateFormData("email", value)}
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/36">
                      Type of Inquiry
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {inquiryTypes.map((item) => {
                        const isSelected = formData.type === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => updateFormData("type", item.value)}
                            className={`magnetic-card rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] outline-none transition focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black ${
                              isSelected
                                ? "border-electric-blue/45 bg-electric-blue/10 text-electric-blue"
                                : "border-white/10 text-white/45 hover:border-white/20 hover:text-white"
                            }`}
                            aria-pressed={isSelected}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <FloatingTextarea
                    label="Message"
                    value={formData.message}
                    required
                    onChange={(value) => updateFormData("message", value)}
                  />

                  {error && (
                    <div className="rounded-2xl border border-electric-blue/25 bg-electric-blue/5 p-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                      {error}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={reducedMotion || isSubmitting ? {} : { scale: 1.02 }}
                    whileTap={reducedMotion || isSubmitting ? {} : { scale: 0.98 }}
                    className="shimmer-button kinetic-border relative isolate inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-electric-blue bg-electric-blue px-8 py-4 text-xs font-black uppercase tracking-[0.28em] text-brand-black outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-4 focus-visible:ring-offset-brand-black"
                  >
                    <span className="relative z-10 inline-flex items-center gap-3">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                          Processing
                        </>
                      ) : (
                        <>
                          Send Inquiry <Send size={16} aria-hidden="true" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
