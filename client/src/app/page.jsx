"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, LineChart, Target, Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const features = [
    {
      icon: <BrainCircuit size={28} className="text-blue-500" />,
      title: "AI Course Generation",
      description: "Instantly generate structured, comprehensive courses on any topic tailored to your learning pace."
    },
    {
      icon: <Target size={28} className="text-teal-500" />,
      title: "Adaptive Quizzing",
      description: "Test your knowledge with AI-generated quizzes that adapt to your strengths and weaknesses."
    },
    {
      icon: <LineChart size={28} className="text-indigo-500" />,
      title: "Real-time Analytics",
      description: "Track your learning journey with intuitive dashboards, progress metrics, and mastery scores."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans flex flex-col">
      {/* Background Animation from your existing setup */}
      <AnimatedBackground />

      {/* Navigation Bar */}
      <nav className="relative z-50 w-full px-6 py-4 flex justify-between items-center border-b border-surface-light bg-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-primary tracking-wide">Learnly AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-text-muted hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Sign Up
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 py-20 text-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>The Future of Learning</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-heading font-extrabold text-primary tracking-tight leading-[1.1] mb-6">
            Master any subject with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
              Personalized AI
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-muted max-w-2xl mb-10 font-medium">
            Learnly AI creates custom courses, tracks your progress, and adapts to how you learn best. Say goodbye to generic tutorials and hello to your personal AI tutor.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(37,99,235,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all text-base"
              >
                Get Started for Free
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-surface border border-surface-light text-text-main font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all text-base"
              >
                Sign In to Dashboard
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 w-full"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -8 }}
              className="bg-surface p-8 rounded-2xl border border-surface-light shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all text-left flex flex-col"
            >
              <div className="w-14 h-14 rounded-xl bg-background border border-surface-light flex items-center justify-center mb-6 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-heading font-bold text-primary mb-3">{feature.title}</h3>
              <p className="text-text-muted leading-relaxed text-sm font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-8 text-center border-t border-surface-light bg-surface/30">
        <p className="text-text-muted text-xs font-semibold tracking-wide">
          © {new Date().getFullYear()} Learnly AI Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}