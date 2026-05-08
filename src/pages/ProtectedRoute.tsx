import { Navigate, Outlet } from "react-router-dom";
import { motion } from "motion/react";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-black text-white">
        <div className="relative">
          <motion.div
            className="absolute inset-[-18px] rounded-full border border-electric-blue/30"
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.08, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <div className="font-display text-4xl font-black tracking-tighter">
            MD3<span className="text-electric-blue electric-glow">BEATS</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
