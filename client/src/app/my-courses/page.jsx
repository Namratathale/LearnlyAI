"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import API from "@/lib/api";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

export default function MyLibrary() {
  const [courses, setCourses] = useState([]);
=======
import { motion } from "framer-motion";
import API from "@/lib/api";
import { BookOpen, ChevronRight, ArrowLeft, PlayCircle, Clock, Sparkles } from "lucide-react";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function MyLibrary() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
>>>>>>> 453d276 (Initial clean commit)
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
<<<<<<< HEAD
      const { data } = await API.get('/courses/my-courses');
      setCourses(data.data);
=======
      try {
        const { data } = await API.get('/courses/my-courses');
        setCourses(data.data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setLoading(false);
      }
>>>>>>> 453d276 (Initial clean commit)
    };
    fetchCourses();
  }, []);

  return (
<<<<<<< HEAD
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Learning Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">{course.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{course.description}</p>
            
            <button 
              onClick={() => router.push(`/course/${course._id}`)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              Resume Learning <ChevronRight size={16} />
            </button>
          </div>
        ))}
=======
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors duration-500 font-sans">
      
      {/* Top Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-6xl mx-auto flex items-center justify-between mb-12"
      >
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold shadow-sm"
        >
          <ArrowLeft size={18} /> Back to Workspace
        </button>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-heading text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            My Learning <Sparkles className="text-amber-400 animate-pulse" size={32} />
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            Pick up where you left off. Your AI-generated courses are waiting for you.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
            <BookOpen size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
            <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Your library is empty</h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">Head back to the workspace to generate your first course.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Generate a Course
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {courses.map(course => (
  <motion.div 
    key={course._id} 
    variants={cardVariants}
    whileHover={{ y: -8, scale: 1.02 }}
    className="group bg-white dark:bg-slate-900 p-1 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border border-slate-200 dark:border-slate-800"
  >
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 rounded-[22px] p-6 flex flex-col relative overflow-hidden">
      
      {/* Decorative Gradient Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full group-hover:bg-teal-500/20 transition-colors"></div>

      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800/50">
        <BookOpen size={28} />
      </div>
      
      <h3 className="font-heading text-xl text-slate-900 dark:text-white mb-3 line-clamp-2">
        {course.title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
        {course.description}
      </p>
      
      {/* --- NEW PROGRESS BAR SECTION --- */}
      <div className="mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-800">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>{course.progressPercentage === 100 ? 'Completed' : 'Course Progress'}</span>
          <span className="text-blue-600 dark:text-blue-400">{course.progressPercentage || 0}%</span>
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-5">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full" 
            initial={{ width: 0 }} 
            animate={{ width: `${course.progressPercentage || 0}%` }} 
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>

        {/* Footer info & Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Clock size={14} /> 
            {course.estimatedTime || "Self-Paced"}
          </div>
          
          <button 
            onClick={() => router.push(`/course/${course._id}`)}
            className={`h-10 rounded-full flex items-center justify-center group-hover:w-full group-hover:px-6 transition-all duration-300 overflow-hidden ${
              course.progressPercentage === 100 
              ? 'bg-emerald-500 text-white w-10 group-hover:justify-between' 
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-10 group-hover:justify-between'
            }`}
          >
            <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto font-bold whitespace-nowrap transition-all duration-300 text-sm">
              {course.progressPercentage === 100 ? 'Review' : course.progressPercentage > 0 ? 'Resume' : 'Start'}
            </span>
            {course.progressPercentage === 100 ? <CheckCircle size={18} className="shrink-0" /> : <PlayCircle size={18} className="shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
))}
          </motion.div>
        )}
>>>>>>> 453d276 (Initial clean commit)
      </div>
    </div>
  );
}