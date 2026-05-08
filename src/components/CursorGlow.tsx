import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      glow.style.transform = `translate3d(${event.clientX - 100}px, ${event.clientY - 100}px, 0)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 hidden h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(0,209,255,0.15)_0%,rgba(0,209,255,0.08)_34%,transparent_70%)] blur-[80px] will-change-transform md:block"
    />
  );
}
