"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  CheckCircle, Circle, Lock, MessageSquare, 
  Menu, X, Sun, Moon, ArrowLeft, PlayCircle, 
  Award, Sparkles, Send, BookOpen, LayoutDashboard, UserCircle, Library, Settings
} from "lucide-react";
import { Edit3, Save, Loader2, FileText } from "lucide-react";
import API from "@/lib/api";

export default function CoursePlayer({ course }) {
  const router = useRouter();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [progress, setProgress] = useState({ completedLessons: [] });
  const [loading, setLoading] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved', 'typing', 'saving', 'error'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null); // { passed, score, correctAnswers }
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
  // Only trigger save if the user is actively typing
  if (saveStatus === "typing") {
    if (!currentLesson) {
        setSaveStatus("saved");
        return;
      }
    const delayDebounceFn = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await API.post('/courses/notes', { 
          courseId: course._id,
          lessonId: currentLesson?._id,
          content: noteContent
        });
        setSaveStatus("saved");
      } catch (error) {
        console.error("Failed to save note");
        setSaveStatus("error");
      }
    }, 1000); // Waits 1 second after the user stops typing to trigger API

    return () => clearTimeout(delayDebounceFn);
  }
}, [noteContent, saveStatus, currentLesson, course._id]);

// 4. Reset/Fetch note content when switching lessons
useEffect(() => {
  const fetchNote = async () => {
    if (!currentLesson) return;
    setNoteContent(""); 
    try {
      const { data } = await API.get(`/courses/notes/${course._id}/${currentLesson._id}`); 
      setNoteContent(data.note || "");
    } catch (e) {
      setNoteContent("");
    }
  };
  fetchNote();
}, [currentLesson, course._id]);

// NEW: Fetch saved progress on page load
useEffect(() => {
  const fetchProgress = async () => {
    try {
      const { data } = await API.get(`/courses/progress/${course._id}`);
      if (data.completedLessons) {
        setProgress({ completedLessons: data.completedLessons });
      }
    } catch (e) {
      console.error("Failed to fetch initial progress");
    }
  };
  
  if (course?._id) {
    fetchProgress();
  }
}, [course._id]);


useEffect(() => {
    setQuizAnswers({});
    setQuizResult(null);
  }, [currentLesson]);

  const handleQuizSubmit = async () => {
    setIsSubmittingQuiz(true);
    try {
      // Map the object state to a flat array matching question indexes
      const answersArray = currentLesson.quizData.questions.map((_, i) => quizAnswers[i] ?? -1);

      const { data } = await API.post('/courses/submit-quiz', {
        courseId: course._id,
        lessonId: currentLesson._id,
        answers: answersArray
      });

      setQuizResult(data);

      if (data.passed) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
        
        // Update local progress state so the sidebar unlocks the next lesson
        setProgress(prev => ({ 
          ...prev, 
          completedLessons: [...new Set([...prev.completedLessons, currentLesson._id])] 
        }));
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
    setIsSubmittingQuiz(false);
  };


  // Flatten lessons for linear navigation & progress calculation
  const linearLessons = useMemo(() => {
    let list = [];
    course.chapters?.forEach(ch => {
      ch.topics?.forEach(top => {
        top.lessons?.forEach(les => list.push({ ...les, chapterTitle: ch.title }));
      });
    });
    return list;
  }, [course]);

  const progressPercentage = Math.round((progress.completedLessons.length / linearLessons.length) * 100) || 0;

  const isLessonLocked = (lessonId) => {
    const index = linearLessons.findIndex(l => l._id === lessonId);
    if (index === 0) return false;
    const prevLesson = linearLessons[index - 1];
    return !progress.completedLessons.includes(prevLesson._id);
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    setLoading(true);
    
    // Trigger Confetti Celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b']
    });

    try {
      // Change this line:
      await API.post('/courses/mark-complete', 
        { lessonId: currentLesson._id, 
          courseId: course._id
        });
      setProgress(prev => ({ 
        ...prev, 
        completedLessons: [...new Set([...prev.completedLessons, currentLesson._id])] 
      }));
      
      // Auto-advance to next lesson after a short delay
      setTimeout(() => {
        const currentIndex = linearLessons.findIndex(l => l._id === currentLesson._id);
        if (currentIndex < linearLessons.length - 1) {
          setCurrentLesson(linearLessons[currentIndex + 1]);
        }
      }, 1500);
      
    } catch (e) {
      console.error("Failed to save progress");
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentLesson) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsBotTyping(true);

    try {
      // Send the current lesson context to the backend so the AI knows what to talk about
      const { data } = await API.post("/courses/chat", {
        prompt: userMessage.content,
        context: `The user is studying a lesson titled "${currentLesson.title}". Here is the lesson content: ${currentLesson.explanation}`
      });

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I'm having trouble connecting to my neural net right now. Please try again!" },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden bg-background dark:bg-slate-900 transition-colors duration-500 font-sans ${darkMode ? 'dark' : ''}`}>
      
      {/* 1. SIDEBAR (Curriculum Drawer) */}
      <motion.aside 
        initial={{ width: 320 }}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        className="border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-30 flex flex-col overflow-hidden shrink-0"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">          <button 
            onClick={() => router.push('/my-courses')}
            className="flex items-center gap-2 text-sm font-bold text-text-muted dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Library
          </button>
          <h2 className="font-heading text-primary dark:text-white text-xl line-clamp-2">{course.title}</h2>
          
          {/* Mini Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold text-text-muted dark:text-slate-500 mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full" 
                initial={{ width: 0 }} 
                animate={{ width: `${progressPercentage}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {course.chapters?.map((ch, idx) => (
            <div key={idx} className="mb-8">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-slate-500 mb-3">Module {idx + 1}</h4>
              {ch.topics?.map(top => (
                 <div key={top.title} className="mb-4">
                   <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{top.title}</p>
                   <div className="space-y-1">
                     {top.lessons?.map(les => {
                       const locked = isLessonLocked(les._id);
                       const isCompleted = progress.completedLessons.includes(les._id);
                       const isActive = currentLesson?._id === les._id;

                       return (
                         <button 
                           key={les._id}
                           disabled={locked}
                           onClick={() => !locked && setCurrentLesson(les)}
                           className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm transition-all duration-300
                             ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}
                             ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 shadow-sm' : 'border border-transparent'}
                           `}
                         >
                           {locked ? <Lock size={16} className="text-slate-400" /> : 
                            isCompleted ? <CheckCircle size={16} className="text-emerald-500 shadow-emerald-500/50 drop-shadow-md" /> : 
                            <Circle size={16} className="text-slate-300 dark:text-slate-600" />}
                           
                           <span className={`text-left line-clamp-2 ${isActive ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                             {les.title}
                           </span>
                         </button>
                       );
                     })}
                   </div>
                 </div>
              ))}
            </div>
          ))}
        </div>
      </motion.aside>

      {/* 2. MAIN LEARNING CANVAS */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        
        {/* Header Actions */}
        {/* Header Actions */}
<header className="absolute top-0 w-full px-8 py-4 flex justify-between items-center z-20 pointer-events-none">
   <button onClick={() => setSidebarOpen(!sidebarOpen)} className="pointer-events-auto p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-blue-600 transition-colors">
     <Menu size={20} />
   </button>
   
   <div className="flex gap-3 pointer-events-auto">
     <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-slate-500 hover:text-amber-500 transition-colors">
       {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
     </button>
     
     {/* NEW: Notes Button */}
     <button 
       onClick={() => { setNotesOpen(!notesOpen); setTutorOpen(false); }} 
       className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-sm hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold text-sm"
     >
       <Edit3 size={16} /> Notes
     </button>

     <button 
       onClick={() => { setTutorOpen(!tutorOpen); setNotesOpen(false); }} 
       className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 font-bold text-sm"
     >
       <Sparkles size={16} /> Zoiee AI
     </button>
   </div>
</header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-16 pt-24 pb-32">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {currentLesson ? (
                <motion.div 
                  key={currentLesson._id}
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <BookOpen size={14} /> Lesson
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-8 leading-tight">
                    {currentLesson.title}
                  </h1>
                  
                  {/* Dynamic Lesson Content: Quiz vs Standard Text */}
                  {/* ====================== 1. STANDARD CONTENT UI ====================== */}
                  <div className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
                    <p>{currentLesson.explanation}</p>
                    
                    {/* Placeholder for AI Generated Diagram */}
                    <div className="my-10 w-full h-72 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                      <Sparkles size={32} className="text-slate-400 mb-3 opacity-50" />
                      <span className="text-slate-500 font-medium">AI Generated Diagram: {currentLesson.title}</span>
                    </div>
                  </div>

                  {/* ====================== 2. KNOWLEDGE CHECK (QUIZ UI) ====================== */}
                  {(currentLesson.type === 'quiz' || (currentLesson.quizData && currentLesson.quizData.questions?.length > 0)) ? (
                    <div className="space-y-8 mb-12 border-t border-slate-200 dark:border-slate-800 pt-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Award size={20} />
                        </div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800 dark:text-white">
                          Knowledge Check
                        </h2>
                      </div>
                      
                      {!quizResult ? (
                        /* Active Quiz View */
                        <div className="space-y-12">
                          {currentLesson.quizData.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                                <span className="text-blue-500 mr-2">{qIndex + 1}.</span> {q.question}
                              </h3>
                              <div className="space-y-3">
                                {q.options.map((opt, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                      ${quizAnswers[qIndex] === optIndex 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 shadow-sm' 
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700'
                                      }`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                      ${quizAnswers[qIndex] === optIndex ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                      {quizAnswers[qIndex] === optIndex && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                    </div>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}

                          <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleQuizSubmit}
                            disabled={isSubmittingQuiz || Object.keys(quizAnswers).length !== currentLesson.quizData.questions.length}
                            className="w-full py-4 rounded-2xl font-bold text-lg bg-blue-600 text-white shadow-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                          >
                            {isSubmittingQuiz ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />}
                            Submit Final Answers
                          </motion.button>
                        </div>
                      ) : (
                        /* Results View */
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-xl">
                          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner border-4 ${quizResult.passed ? 'bg-emerald-50 border-emerald-100 text-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 border-red-100 text-red-500 dark:bg-red-900/20 dark:border-red-800'}`}>
                            {quizResult.passed ? <Award size={48} /> : <X size={48} />}
                          </div>
                          
                          <h2 className="text-3xl font-heading font-bold text-slate-800 dark:text-white mb-2">
                            {quizResult.passed ? "Assessment Passed!" : "Needs Review"}
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 mb-8">
                            You scored <strong className={`text-xl ${quizResult.passed ? 'text-emerald-500' : 'text-red-500'}`}>{quizResult.score}%</strong> (Required: {currentLesson.quizData.passingScore}%)
                          </p>

                          {quizResult.passed ? (
                            <button 
                              onClick={() => {
                                const currentIndex = linearLessons.findIndex(l => l._id === currentLesson._id);
                                if (currentIndex < linearLessons.length - 1) setCurrentLesson(linearLessons[currentIndex + 1]);
                              }}
                              className="w-full py-4 rounded-2xl font-bold text-lg bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
                            >
                              Continue to Next Lesson
                            </button>
                          ) : (
                            <div className="space-y-6 text-left border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
                              <h4 className="font-bold text-slate-700 dark:text-slate-300">Review your answers:</h4>
                              {currentLesson.quizData.questions.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm border border-slate-200 dark:border-slate-700">
                                  <p className="font-bold mb-2 text-slate-800 dark:text-slate-200">{q.question}</p>
                                  <p className="text-emerald-600 dark:text-emerald-400"><span className="font-bold">Correct:</span> {q.options[quizResult.correctAnswers[idx]]}</p>
                                  {quizAnswers[idx] !== quizResult.correctAnswers[idx] && (
                                    <p className="text-red-500 mt-1"><span className="font-bold">You selected:</span> {q.options[quizAnswers[idx]]}</p>
                                  )}
                                </div>
                              ))}
                              <button 
                                onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                                className="w-full py-4 mt-6 rounded-2xl font-bold text-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg transition-transform active:scale-95"
                              >
                                Retake Assessment
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* ====================== 3. STANDARD MARK COMPLETE BUTTON (If no quiz exists) ====================== */
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading || progress.completedLessons.includes(currentLesson._id)}
                      className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl
                        ${progress.completedLessons.includes(currentLesson._id) 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-none' 
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-slate-900/20 dark:hover:shadow-white/20'
                        }`}
                      onClick={handleMarkComplete}
                    >
                      {progress.completedLessons.includes(currentLesson._id) ? (
                        <><CheckCircle size={24} /> Lesson Completed</>
                      ) : (
                        <><Award size={24} /> Mark as Complete & Next</>
                      )}
                    </motion.button>
                  )}

                </motion.div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                  <motion.div 
                    animate={{ y: [0, -15, 0] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner"
                  >
                    <PlayCircle size={40} className="text-blue-500" />
                  </motion.div>
                  <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-white mb-2">Ready to learn?</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md">Select a lesson from the curriculum sidebar to begin your journey.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 3. AI TUTOR WIDGET (Floating Right Panel) */}
      {/* 3. AI TUTOR WIDGET (Floating Right Panel) */}
      <AnimatePresence>
        {tutorOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute right-6 bottom-6 w-96 h-[600px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Widget Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-sm">Zoiee Tutor</h3>
                  <p className="text-[10px] text-blue-100 uppercase tracking-widest">AI Learning Assistant</p>
                </div>
              </div>
              <button onClick={() => setTutorOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
              {/* Initial Greeting */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%]">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Hi! I'm Zoiee. I can see you are currently on <strong>{currentLesson?.title || "the course dashboard"}</strong>. What would you like me to explain?
                </p>
              </div>

              {/* Dynamic Chat Messages */}
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-sm self-end' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm self-start'
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {/* Typing Indicator */}
              {isBotTyping && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] self-start flex gap-1">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="relative flex items-center">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 pl-5 pr-12 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                  placeholder={currentLesson ? "Ask about this lesson..." : "Select a lesson first"} 
                  disabled={!currentLesson || isBotTyping}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!currentLesson || isBotTyping || !chatInput.trim()}
                  className="absolute right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 4. NOTES WIDGET (Floating Right Panel) */}
<AnimatePresence>
  {notesOpen && (
    <motion.div 
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="absolute right-6 bottom-6 w-[400px] h-[600px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold font-heading text-slate-800 dark:text-white">Personal Notes</h3>
            
            {/* Auto-Save Status Indicator */}
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {saveStatus === 'typing' && <><Edit3 size={10}/> Typing...</>}
              {saveStatus === 'saving' && <><Loader2 size={10} className="animate-spin text-blue-500"/> Saving</>}
              {saveStatus === 'saved' && <><CheckCircle size={10} className="text-emerald-500"/> Saved to Cloud</>}
              {saveStatus === 'error' && <span className="text-red-500">Failed to save</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setNotesOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
          <X size={16} />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-0 relative">
        <textarea
          value={noteContent}
          onChange={(e) => {
            setNoteContent(e.target.value);
            setSaveStatus("typing");
          }}
          placeholder="Jot down your thoughts, key takeaways, or questions here..."
          className="w-full h-full resize-none bg-transparent p-6 text-slate-700 dark:text-slate-300 outline-none leading-relaxed custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600"
        />
      </div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}