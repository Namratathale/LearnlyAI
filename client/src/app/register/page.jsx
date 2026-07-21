"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import API from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(120);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", otp: ""
  });

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await API.post("/auth/register-step1", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      setStep(2);
      setTimer(120);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to transmit verification token.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await API.post("/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp
      });
      localStorage.setItem("token", data.data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token code.");
    } finally {
      setLoading(false);
    }
  };

  const triggerOAuth = (provider) => {
    if (provider === 'Google') {
      loginWithGoogle();
    } else if (provider === 'GitHub') {
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
    }
  };

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center px-4 relative overflow-hidden font-sans">
      
      <AnimatedBackground />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <Card className="border-surface-light bg-surface shadow-[0_15px_40px_rgba(0,0,0,0.06)] rounded-2xl p-1 sm:p-3 relative overflow-hidden">
          
          {step === 2 && (
            <button 
              type="button"
              onClick={() => { setError(""); setStep(1); }} 
              className="absolute top-4 left-4 text-text-muted hover:text-[#0891B2] transition-colors p-1.5 rounded-full hover:bg-background z-20"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mb-4 mt-2">
            {[1, 2].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                  step >= num ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md" : "bg-surface-light text-text-muted"
                }`}>
                  {step > num ? <CheckCircle size={12} /> : num}
                </div>
                {num < 2 && <div className={`w-12 h-[2px] mx-1.5 ${step > num ? "bg-teal-500" : "bg-surface-light"}`} />}
              </div>
            ))}
          </div>

          <CardHeader className="text-center py-2">
            <CardTitle className="font-heading text-2xl text-primary tracking-wide mb-1">
              {step === 1 ? "Start Learning" : "Secure Verification"}
            </CardTitle>
            <CardDescription className="text-text-muted text-[11px] font-sans">
              {step === 1 ? "Initialize your global student profile workspace." : "Enter the token dispatched to your inbox."}
            </CardDescription>
          </CardHeader>

          <div className="px-6 pb-2">
            {error && (
              <div className="mb-3 bg-red-50 text-red-600 p-2.5 rounded-lg text-xs font-medium border border-red-100 font-sans text-center">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleStep1Submit} 
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[9px] uppercase tracking-widest text-text-muted font-bold ml-1">Full Name</Label>
                    <div className="relative group">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600" />
                      <Input id="name" type="text" placeholder="Jane Doe" required className="pl-9 h-9 bg-background focus-visible:ring-blue-500 text-xs" 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[9px] uppercase tracking-widest text-text-muted font-bold ml-1">Official Email</Label>
                    <div className="relative group">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600" />
                      <Input id="email" type="email" placeholder="jane@university.edu" required className="pl-9 h-9 bg-background focus-visible:ring-blue-500 text-xs" 
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-[9px] uppercase tracking-widest text-text-muted font-bold ml-1">Password</Label>
                      <div className="relative group">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600" />
                        <Input id="password" type="password" placeholder="••••••••" required className="pl-9 h-9 bg-background focus-visible:ring-blue-500 text-xs" 
                          value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-[9px] uppercase tracking-widest text-text-muted font-bold ml-1">Confirm</Label>
                      <div className="relative group">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600" />
                        <Input id="confirmPassword" type="password" placeholder="••••••••" required className="pl-9 h-9 bg-background focus-visible:ring-blue-500 text-xs" 
                          value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-10 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 text-sm">
                    {loading ? "Processing..." : "Generate Verification Token"} <ArrowRight size={14} />
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleVerifyOTP} 
                  className="space-y-5 py-4"
                >
                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-center block text-[10px] uppercase tracking-widest text-text-muted font-bold">Enter 6-Digit Code</Label>
                    <Input 
                      id="otp"
                      type="text" 
                      maxLength={6} 
                      placeholder="000000" 
                      className="text-center text-2xl tracking-[8px] h-12 font-bold text-primary bg-background focus-visible:ring-blue-500 w-40 mx-auto" 
                      required 
                      value={formData.otp} 
                      onChange={(e) => setFormData({...formData, otp: e.target.value})} 
                    />
                    
                    <div className="text-center text-xs text-text-muted">
                      {timer > 0 ? (
                        <p>Token active for <span className="text-[#0891B2] font-bold">{formatTime(timer)}</span></p>
                      ) : (
                        <button type="button" onClick={handleStep1Submit} className="text-[#0891B2] font-bold hover:underline inline-flex items-center gap-1">
                          <RefreshCw size={12} /> Resend Token Code
                        </button>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-10 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98] text-sm">
                    {loading ? "Validating..." : "Verify & Initialize Account"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {step === 1 && (
            <CardFooter className="flex flex-col p-0 pb-4">
              <p className="text-center text-[11px] text-text-muted mt-2">
                Already registered?{" "}
                <Link href="/login" className="text-[#1E3A8A] font-extrabold hover:text-[#0891B2] hover:underline underline-offset-4 transition-colors">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}