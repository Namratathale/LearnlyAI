"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Code, Lightbulb, Pencil, Laptop, Compass, 
  Database, Globe, Cpu, Layers, Monitor,
  GraduationCap, Briefcase, Calculator, Atom
} from "lucide-react";

// 1. Expanded Professional Icon Set
const icons = [
  BookOpen, Code, Lightbulb, Pencil, Laptop, Compass, 
  Database, Globe, Cpu, Layers, Monitor,
  GraduationCap, Briefcase, Calculator, Atom
];

// 2. Professional, vibrant but muted colors for a light theme
const colors = [
  "text-blue-500", 
  "text-teal-500", 
  "text-emerald-500", 
  "text-indigo-500", 
  "text-cyan-600",
  "text-violet-500"
];

export default function AnimatedBackground() {
  const [floatingIcons, setFloatingIcons] = useState([]);

  const generateIcon = () => {
    return {
      id: Math.random().toString(36).substring(2, 9),
      IconComponent: icons[Math.floor(Math.random() * icons.length)],
      colorClass: colors[Math.floor(Math.random() * colors.length)],
      x: Math.floor(Math.random() * 90) + 5, // 5% to 95% width to keep them on screen
      y: Math.floor(Math.random() * 90) + 5, // 5% to 95% height
      size: Math.floor(Math.random() * 20) + 24, // Sizes between 24px and 44px
      duration: Math.random() * 7 + 8, // Float animation lasts between 8s and 15s
    };
  };

  useEffect(() => {
    // FIX: Instantly populate the screen with an initial batch of 8 icons on mount
    const initialIcons = Array.from({ length: 8 }).map(generateIcon);
    setFloatingIcons(initialIcons);

    // Continuously generate new icons to keep the background active
    const interval = setInterval(() => {
      setFloatingIcons((prev) => {
        // Performance cap: prevent more than 15 icons from existing at once
        if (prev.length >= 15) return prev;
        return [...prev, generateIcon()];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handleRemove = (id) => {
    setFloatingIcons((prev) => prev.filter((icon) => icon.id !== id));
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Continuous Gradient Orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[90px]"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[90px]"
      />

      {/* Interactive Floating Icons */}
      <AnimatePresence>
        {floatingIcons.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 40, scale: 0.3 }}
            // Float upward slightly, maintaining a professional 25% opacity
            animate={{ opacity: 0.25, y: -100, scale: 1 }} 
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
            transition={{ duration: item.duration, ease: "linear" }}
            onAnimationComplete={() => handleRemove(item.id)} // FIX: Auto-removes exactly when animation finishes
            className={`absolute pointer-events-auto cursor-pointer hover:opacity-100 hover:scale-125 transition-all duration-300 ${item.colorClass}`}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            onClick={() => handleRemove(item.id)}
          >
            <item.IconComponent size={item.size} strokeWidth={1.5} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}