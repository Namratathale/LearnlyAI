"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, 
  Menu, X, LayoutDashboard, UserCircle, Settings, LogOut, Bell, ChevronRight,
  Library, BarChart3, Flame, TrendingUp, Clock, Target, Calendar
} from "lucide-react";
import API from "@/lib/api";

import { getUploadUrl, processPdf, getMe, startGeneration, getCourse } from "@/lib/api";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const router = useRouter();
  
  // App State
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("workspace"); // workspace, profile, settings
  
  // Upload Engine State
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedPreview, setExtractedPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  const [analyticsData, setAnalyticsData] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
  // Fetch User Data on Mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getMe();
        setUser(data.data);
      } catch (err) {
        // If token is invalid/expired, boot them to login
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
  if (user) setEditForm({ name: user.name, email: user.email });
}, [user]);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);

  // --- UPLOAD ENGINE LOGIC ---
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setStatus("idle");
      setErrorMessage("");
    } else {
      setErrorMessage("Please select a valid PDF document.");
    }
  };

  const handleUploadSequence = async () => {
    if (!file) return;
    try {
      setStatus("uploading");
      setProgress(10);

      const { data: urlData } = await getUploadUrl({ fileName: file.name, fileType: file.type });
      const { uploadUrl, fileKey } = urlData.data;
      setProgress(30);

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(30 + Math.floor(percentCompleted * 0.4)); 
        },
      });

      setStatus("processing");
      setProgress(75);
      
      const { data: processData } = await processPdf({ fileKey, originalFileName: file.name, fileSize: file.size });

      setProgress(100);
      setStatus("success");
      setExtractedPreview(processData.data.skeleton);
    } catch (error) {
      console.error("Upload sequence failed:", error);
      setStatus("error");
      setErrorMessage(error.response?.data?.message || "An error occurred during upload.");
      setProgress(0);
    }
  };

  const handleProfileUpdate = async () => {
  try {
    await API.put('/courses/profile', editForm);
    setUser({...user, ...editForm});
    setIsEditing(false);
  } catch (err) {
    setErrorMessage("Failed to update profile.");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const isFullyGenerated = extractedPreview?.chapters?.every(ch =>
    ch.topics.every(top =>
      top.lessons.every(les => 
        les.generationStatus === 'completed' || les.generationStatus === 'failed'
      )
    )
  );

  // --- UI COMPONENTS ---
  const SidebarItem = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? "bg-gradient-to-r from-blue-600/10 to-teal-500/10 text-blue-700 font-bold" 
          : "text-text-muted hover:bg-surface-light/50 hover:text-primary font-medium"
      }`}
    >
      <Icon size={20} className={activeTab === id ? "text-blue-600" : ""} />
      {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
      {sidebarOpen && activeTab === id && <ChevronRight size={16} className="ml-auto text-blue-600" />}
    </button>
  );

  // Fetch Analytics when the tab is clicked
  useEffect(() => {
    if (activeTab === "analytics" && !analyticsData) {
      const fetchAnalytics = async () => {
        try {
          const { data } = await API.get('/courses/analytics');
          setAnalyticsData(data);
        } catch (error) {
          console.error("Failed to load analytics");
        }
      };
      fetchAnalytics();
    }
  }, [activeTab, analyticsData]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={40} className="text-[#0891B2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-sans text-text-main">
      
      {/* --- SLIDING SIDEBAR --- */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-20 shrink-0 shadow-lg"      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              {/* LOGO PLACEHOLDER */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-heading font-bold text-lg">A</span>
              </div>
              <span className="font-heading text-xl text-primary tracking-wide">Learnly</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center shadow-md mx-auto">
              <span className="text-white font-heading font-bold text-lg">A</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Workspace" id="workspace" />
          <SidebarItem icon={UserCircle} label="Profile Details" id="profile" />
          
          {/* FIXED: Single, functioning navigation button to the Library page */}
          <button 
            onClick={() => router.push('/my-courses')} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:bg-surface-light/50 hover:text-primary font-medium transition-all"
          >
            <Library size={20} />
            {sidebarOpen && <span className="whitespace-nowrap">My Courses</span>}
            {sidebarOpen && <ChevronRight size={16} className="ml-auto text-transparent" />}
          </button>
          <SidebarItem icon={BarChart3} label="Analytics & Reports" id="analytics" />
          <SidebarItem icon={Settings} label="System Settings" id="settings" />
        </nav>

{/* <button onClick={() => router.push('/my-courses')} className="flex items-center gap-3 p-3 w-full hover:bg-blue-50 rounded-lg">
  <BookOpen size={20} /> My Library
</button> */}

        <div className="p-4 border-t border-surface-light">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Secure Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Animated Background for Main Area */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
          <motion.div animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
          <motion.div animate={{ y: [0, 30, 0], x: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
        </div>

        {/* --- TOP NAVBAR --- */}
        <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-surface-light flex items-center justify-between px-6 z-10 dark:bg-slate-900/80 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-text-muted hover:bg-surface-light transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-heading text-primary hidden sm:block capitalize">
              {activeTab === 'workspace' ? 'Course Engine Workspace' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 relative text-text-muted hover:text-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
            </button>
            <div className="h-8 w-[1px] bg-surface-light mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-primary leading-tight">{user.name}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{user.authProvider === 'local' ? 'Standard User' : 'Verified Student'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-teal-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={24} className="text-blue-500" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC TAB CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 z-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: WORKSPACE (PDF ENGINE & SKELETON REVIEW) */}
              {activeTab === "workspace" && (
                <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden transition-colors duration-300">                    <CardHeader className="bg-slate-50/50 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <CardTitle className="text-lg font-heading text-slate-900 dark:text-slate-100">
                        {status === "skeleton_review" || status === "generating_content" ? "Course Blueprint" : "Course Generator Engine"}
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        {status === "skeleton_review" || status === "generating_content" 
                          ? "Review the AI-generated curriculum structure before initiating deep content extraction."
                          : "Upload a PDF textbook, syllabus, or document to begin AI extraction."}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-8">
                      <AnimatePresence mode="wait">
                        
                        {/* States: Idle, Uploading, Processing remain identical... */}
                        {status === "idle" && (
                          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center border-2 border-dashed border-surface-lighter rounded-xl p-16 bg-slate-50 hover:bg-white hover:border-blue-500 transition-all relative group cursor-pointer shadow-sm">
                            <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300 ">
                              <UploadCloud size={40} />
                            </div>
                            {file ? (
                              <div className="text-center">
                                <p className="font-bold text-primary mb-1 text-lg">{file.name}</p>
                                <p className="text-sm text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="font-bold text-slate-700 mb-2 text-lg">Click or drag PDF here</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Maximum file size: 50MB</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {(status === "uploading" || status === "processing") && (
                          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-8">
                              <div className="w-24 h-24 rounded-full border-4 border-surface-light border-t-blue-600 animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center text-blue-600"><Loader2 size={32} className="animate-pulse" /></div>
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-3">
                              {status === "uploading" ? "Transmitting to Secure Vault..." : "Designing Curriculum Skeleton..."}
                            </h3>
                            <p className="text-sm text-text-muted mb-10 max-w-md">
                              {status === "uploading" 
                                ? "Uploading your file directly to our distributed storage infrastructure." 
                                : "The AI Orchestrator is analyzing the document structure and drafting the syllabus."}
                            </p>
                            
                            <div className="w-full max-w-lg bg-surface-light rounded-full h-3 overflow-hidden shadow-inner">
                              <motion.div className="bg-gradient-to-r from-blue-600 to-teal-500 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.5 }} />
                            </div>
                            <p className="text-sm font-bold text-blue-600 mt-4 tracking-wider">{progress}% COMPLETE</p>
                          </motion.div>
                        )}

                        {/* NEW STATE: SKELETON REVIEW & GENERATING */}
                        {(status === "success" || status === "generating") && extractedPreview && (
                          <motion.div key="skeleton" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-2">
                            
                            {/* Blueprint Header */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-surface-light mb-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h2 className="text-2xl font-heading text-primary">{extractedPreview.title}</h2>
                                  <p className="text-text-muted mt-2">{extractedPreview.description}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  extractedPreview.difficultyLevel === 'Advanced' ? 'bg-red-100 text-red-700' :
                                  extractedPreview.difficultyLevel === 'Intermediate' ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {extractedPreview.difficultyLevel}
                                </span>
                              </div>
                              <div className="flex gap-6 mt-4 pt-4 border-t border-surface-light text-sm font-medium">
                                <span className="flex items-center gap-2 text-slate-600"><FileText size={16}/> {extractedPreview.documentType}</span>
                                <span className="flex items-center gap-2 text-slate-600"><Loader2 size={16} className={status === 'generating' ? 'animate-spin' : 'hidden'}/> Est. Time: {extractedPreview.estimatedTime}</span>
                              </div>
                            </div>

                            {/* Dynamic Chapter Tree */}
                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                              {extractedPreview.chapters?.map((chapter, cIdx) => (
                                <div key={cIdx} className="border border-surface-light rounded-xl overflow-hidden">
                                  <div className="bg-surface-light/50 px-5 py-4 border-b border-surface-light">
                                    <h4 className="font-bold text-primary">Module {cIdx + 1}: {chapter.title}</h4>
                                    <p className="text-xs text-text-muted mt-1">{chapter.description}</p>
                                  </div>
                                  <div className="bg-white p-5 space-y-4">
                                    {chapter.topics?.map((topic, tIdx) => (
                                      <div key={tIdx} className="pl-4 border-l-2 border-blue-100">
                                        <h5 className="text-sm font-bold text-slate-700 mb-2">{topic.title}</h5>
                                        <div className="space-y-2">
                                          {topic.lessons?.map((lesson, lIdx) => (
                                            <div key={lIdx} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-lg text-sm border border-surface-lighter">
                                              <span className="text-slate-600">{lesson.title}</span>
                                              
                                              {/* Status Badge */}
                                              {lesson.generationStatus === 'completed' ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle size={14}/> Done</span>
                                              ) : lesson.generationStatus === 'generating' ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-blue-600"><Loader2 size={14} className="animate-spin"/> Writing</span>
                                              ) : lesson.generationStatus === 'failed' ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-red-600"><AlertCircle size={14}/> Failed</span>
                                              ) : (
                                                <span className="text-xs font-bold text-slate-400 uppercase">Pending</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {errorMessage && status === "error" && (
                        <div className="mt-8 flex items-start gap-3 p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium shadow-sm">
                          <AlertCircle size={20} className="shrink-0 mt-0.5" />
                          <p>{errorMessage}</p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="mt-8 flex justify-end gap-4 border-t border-surface-light pt-6">
                        
                        {/* Always show Start Over (unless no file is selected or actively processing) */}
                        {(file || status !== "idle") && status !== "uploading" && status !== "processing" && status !== "generating" && (
                          <Button variant="outline" onClick={() => { setFile(null); setStatus("idle"); setExtractedPreview(""); }} className="h-12 px-6 rounded-xl border-surface-light hover:bg-surface-light text-text-main">
                            Start Over
                          </Button>
                        )}
                        
                        {/* PHASE 1: Analyze */}
                        {status === "idle" && file && (
                          <Button onClick={handleUploadSequence} className="h-12 px-8 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-lg shadow-blue-500/20 font-bold rounded-xl text-md transition-all active:scale-[0.98]">
                            Analyze Document structure
                          </Button>
                        )}

                        {/* PHASE 2: Generate (Only if NOT fully generated yet) */}
                        {status === "success" && extractedPreview && !isFullyGenerated && (
                          <Button 
                            onClick={async () => {
                              try {
                                setStatus("generating");
                                await startGeneration(extractedPreview._id);
                                
                                const interval = setInterval(async () => {
                                  try {
                                    const { data } = await getCourse(extractedPreview._id);
                                    setExtractedPreview(data.data);
                                    
                                    const allLessons = data.data.chapters.flatMap(c => c.topics.flatMap(t => t.lessons));
                                    const isFinished = allLessons.every(l => l.generationStatus === 'completed' || l.generationStatus === 'failed');
                                    const hasFailed = allLessons.some(l => l.generationStatus === 'failed');

                                    if (isFinished) {
                                      clearInterval(interval);
                                      setStatus("success");
                                      if (hasFailed) {
                                        setErrorMessage("Some lessons failed to generate. Check console logs.");
                                        setStatus("error");
                                      }
                                    }
                                  } catch (err) {
                                    clearInterval(interval);
                                    setStatus("error");
                                    setErrorMessage("Connection lost. Please refresh.");
                                  }
                                }, 3000);
                                
                              } catch (err) {
                                console.error("AXIOS ERROR:", err.response?.data || err.message); 
                                setErrorMessage("Failed to start generation engine.");
                                setStatus("error");
                              }
                            }} 
                            className="h-12 px-8 bg-[#1E3A8A] hover:bg-blue-900 text-white shadow-lg shadow-blue-900/20 font-bold rounded-xl text-md transition-all active:scale-[0.98] group"
                          >
                            Generate Full Course Content <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}

                        {/* PHASE 3: Generating State */}
                        {status === "generating" && (
                          <Button disabled className="h-12 px-8 bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin" /> Parallel Processing Active...
                          </Button>
                        )}

                        {/* PHASE 4: Go to Course (When Fully Generated) */}
                        {isFullyGenerated && (
                          <Button 
                            onClick={() => router.push(`/course/${extractedPreview._id}`)} 
                            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all"
                          >
                            Go to Course <ChevronRight size={18} className="ml-2" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* TAB 2: PROFILE */}
              {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="border-surface-light shadow-md rounded-2xl overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-500 relative"></div>
                  <CardContent className="px-8 pb-8 relative -mt-12">
                    <div className="flex justify-between items-end mb-6">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
                        <UserCircle size={64} className="text-blue-200" />
                      </div>
                      <Button 
                        onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                        className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        {isEditing ? "Save Changes" : "Edit Profile"}
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={isEditing ? editForm.name : user.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input 
                          value={isEditing ? editForm.email : user.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

              {/* TAB 3: SETTINGS */}
              {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="border-surface-light shadow-md rounded-2xl">
                  <CardHeader><CardTitle>System Settings</CardTitle></CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-surface-light">
                      <div>
                        <p className="font-bold">Email Notifications</p>
                        <p className="text-sm text-text-muted">Receive course generation updates.</p>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-bold text-primary mb-1">Dark Mode</p>
                      <p className="text-sm text-text-muted">Toggle the application color theme.</p>
                    </div>
                    {/* Update this input to be a controlled component */}
                    <input 
                      type="checkbox" 
                      className="toggle" 
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)} 
                    />
                  </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

              {/* TAB 4: ANALYTICS & REPORTS */}
              {activeTab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
                  
                  <div>
                    <h2 className="text-3xl font-heading font-bold text-slate-800 dark:text-white mb-2">Learning Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Track your streaks, monthly progress, and overall learning velocity.</p>
                  </div>

                  {!analyticsData ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
                  ) : (
                    <>
                      {/* Gamification Stats Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Flame Streak Card */}
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group">
                          <div className="absolute -right-6 -top-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                            <Flame size={120} />
                          </div>
                          <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                              <Flame size={24} className="text-white" />
                            </div>
                            <p className="text-orange-100 font-bold uppercase tracking-widest text-xs mb-1">Current Streak</p>
                            <div className="flex items-end gap-2">
                              <h3 className="text-5xl font-heading font-black">{analyticsData.currentStreak}</h3>
                              <span className="text-lg font-medium mb-1">Days</span>
                            </div>
                            <p className="text-orange-100/80 text-sm mt-4">Personal Best: {analyticsData.highestStreak} Days</p>
                          </div>
                        </div>

                        {/* Monthly Units Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                            <Target size={24} />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">This Month</p>
                          <div className="flex items-end gap-2">
                            <h3 className="text-4xl font-heading font-black text-slate-800 dark:text-white">{analyticsData.monthlyLessons}</h3>
                            <span className="text-lg font-medium text-slate-500 mb-1">Units</span>
                          </div>
                          <p className="text-slate-500 text-sm mt-4 flex items-center gap-1">
                            <TrendingUp size={14} className="text-emerald-500" /> Keep the momentum going!
                          </p>
                        </div>

                        {/* Total Time Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400">
                            <Clock size={24} />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total Time Invested</p>
                          <div className="flex items-end gap-2">
                            <h3 className="text-4xl font-heading font-black text-slate-800 dark:text-white">
                              {analyticsData.totalTimeMinutes >= 60 ? (analyticsData.totalTimeMinutes / 60).toFixed(1) : analyticsData.totalTimeMinutes}
                            </h3>
                            <span className="text-lg font-medium text-slate-500 mb-1">
                              {analyticsData.totalTimeMinutes >= 60 ? 'Hours' : 'Minutes'}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm mt-4 flex items-center gap-1">
                            Across {analyticsData.totalLessons} total lessons
                          </p>
                        </div>
                      </div>

                      {/* Monthly Activity Report Section */}
                      <Card className="border-surface-light shadow-md rounded-3xl mt-8">
                        <CardHeader className="border-b border-surface-light bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-3">
                            <Calendar className="text-blue-500" size={24} />
                            <div>
                              <CardTitle className="text-lg font-heading text-primary">Monthly Learning Report</CardTitle>
                              <CardDescription>A breakdown of your daily activity for the current month.</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8">
                          {analyticsData.activityLog.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-slate-500">No activity recorded yet this month. Start learning to build your chart!</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {analyticsData.activityLog.slice(-5).reverse().map((log, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                      <CheckCircle size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-slate-200">
                                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </p>
                                      <p className="text-sm text-slate-500">Daily Study Session</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">+{log.lessonsCompleted} Units</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}