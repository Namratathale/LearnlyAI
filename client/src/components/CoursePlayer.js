"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, Circle, Lock, MessageSquare, PlayCircle, 
  Menu, X, Sun, Moon, Award 
} from "lucide-react";
import confetti from 'canvas-confetti';

export default function CoursePlayer({ course }) {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Trigger feedback message
  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Dark mode wrapper */}
      <div className="flex w-full h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* SIDEBAR DRAWER */}
        <motion.aside 
          initial={{ width: 320 }}
          animate={{ width: sidebarOpen ? 320 : 0 }}
          className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-20 overflow-hidden"
        >
          <div className="bg-white/10 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 p-4 rounded-2xl mt-auto">
            <h3 className="font-bold text-white mb-2">Zoiee Tutor</h3>
            <p className="text-xs text-white/70">I am analyzing your progress. Keep going!</p>
          </div>
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg mb-6 truncate">{course.title}</h2>
            {course.chapters.map((ch, idx) => (
              <div key={idx} className="mb-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Module {idx + 1}</h4>
                {ch.topics.map(top => (
                   <div key={top.title} className="mb-2">
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{top.title}</p>
                     {top.lessons.map(les => (
                       <button 
                         key={les._id}
                         onClick={() => setCurrentLesson(les)}
                         className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm transition-all"
                       >
                         <Circle size={14} className="text-slate-300 dark:text-slate-600" />
                         <span className="text-slate-600 dark:text-slate-400">{les.title}</span>
                       </button>
                     ))}
                   </div>
                ))}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 relative flex flex-col h-full overflow-y-auto">
          {/* Top Bar */}
          <header className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
             <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu /></button>
             <button onClick={() => setDarkMode(!darkMode)}>
               {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
          </header>

          <div className="p-8 md:p-16 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {currentLesson ? (
                <motion.div 
                  key={currentLesson._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-8">{currentLesson.title}</h1>
                  <div className="prose prose-lg dark:prose-invert">
                    {currentLesson.explanation}
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-12 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20"
                    onClick={() => {
                      triggerToast("Well done! You've mastered this lesson.");
                      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }}
                  >
                    Mark as Complete
                  </motion.button>
                </motion.div>
              ) : (
                <div className="text-center pt-20">
                  <PlayCircle size={80} className="mx-auto text-slate-300 mb-6" />
                  <h2 className="text-2xl font-bold text-slate-600">Select a lesson to begin your journey</h2>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold z-50"
            >
              <Award size={20} /> {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}