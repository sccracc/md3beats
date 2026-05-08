import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { motion } from "motion/react";
import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (user?.email === import.meta.env.VITE_ADMIN_EMAIL) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate, user]);

  if (!authLoading && user?.email === import.meta.env.VITE_ADMIN_EMAIL) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
        await signOut(auth);
        setError("Unauthorized account.");
        return;
      }
      navigate("/admin/dashboard");
    } catch {
      setError("Access denied. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-black px-5 text-white">
      <div className="absolute left-[-20%] top-[-20%] h-[520px] w-[520px] rounded-full bg-electric-blue/10 blur-[130px]" />
      <div className="absolute inset-0 frequency-lines opacity-35" />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="clean-panel relative w-full max-w-sm p-9 md:p-12"
      >
        <div className="text-center">
          <div className="font-display text-3xl font-black tracking-tighter">
            MD3<span className="text-electric-blue electric-glow">BEATS</span>
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-electric-blue">Admin Portal</p>
          <p className="mt-4 text-sm text-white/25">Restricted Access / Authorized Personnel Only</p>
        </div>
        <div className="my-8 h-px bg-electric-blue/40" />

        <div className="grid gap-6">
          <label className="relative block">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder=" "
              className="peer w-full border-0 border-b border-white/15 bg-transparent pb-3 pt-6 text-white outline-none focus:border-electric-blue"
            />
            <span className="absolute left-0 top-6 text-xs font-bold uppercase tracking-[0.22em] text-white/35 transition peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-electric-blue peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]">
              Email
            </span>
          </label>

          <label className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder=" "
              className="peer w-full border-0 border-b border-white/15 bg-transparent pb-3 pt-6 pr-10 text-white outline-none focus:border-electric-blue"
            />
            <span className="absolute left-0 top-6 text-xs font-bold uppercase tracking-[0.22em] text-white/35 transition peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-electric-blue peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[10px]">
              Password
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute bottom-3 right-0 text-white/45 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-electric-blue"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="button-slide rounded-full border border-electric-blue px-6 py-4 text-xs font-black uppercase tracking-[0.24em] text-electric-blue outline-none hover:text-brand-black focus-visible:ring-2 focus-visible:ring-electric-blue disabled:opacity-50"
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </span>
          </button>

          {error && <p className="text-center text-sm font-bold text-red-400/80">{error}</p>}
        </div>
      </motion.form>
    </div>
  );
}
