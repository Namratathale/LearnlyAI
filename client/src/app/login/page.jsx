"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
// 1. Import the GoogleOAuthProvider here
import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"; 
import API from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedBackground from "@/components/AnimatedBackground";

// 2. Rename your main component to a sub-component (e.g., LoginContent)
function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await API.post('/auth/login', { email, password });
      if (data.status === 'success') {
        localStorage.setItem('token', data.data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid authentication credentials.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const { data } = await API.post('/auth/google', { access_token: tokenResponse.access_token });
        if (data.status === 'success') {
          localStorage.setItem('token', data.data.token);
          router.push('/dashboard');
        }
      } catch (err) {
        setError("Google authentication failed.");
        setLoading(false);
      }
    },
    onError: () => setError("Google login pop-up was closed or failed.")
  });

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
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-surface-light bg-surface shadow-[0_15px_40px_rgba(0,0,0,0.06)] rounded-2xl p-1">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-3xl text-primary tracking-wide mb-1">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-text-muted text-sm font-sans">
              Access your personalized learning environment
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-4">
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100 flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-text-muted font-bold ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    className="pl-9 h-10 bg-background focus-visible:ring-blue-500 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-text-muted font-bold ml-1">Secure Password</Label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 bg-background focus-visible:ring-blue-500 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2 text-sm"
              >
                {loading ? "Authenticating..." : "Secure Access Log In"}
              </Button>
            </form>

            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-surface-light"></div>
              <span className="px-3 text-[10px] text-text-muted font-bold tracking-widest">OR CONTINUE WITH</span>
              <div className="flex-1 border-t border-surface-light"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => triggerOAuth('Google')}
                className="bg-background border border-surface-light text-text-main font-semibold h-10 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
                Google
              </button>
              <button 
                type="button"
                onClick={() => triggerOAuth('GitHub')}
                className="bg-background border border-surface-light text-text-main font-semibold h-10 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </CardContent>

          <CardFooter className="justify-center pt-0 pb-4">
            <p className="text-center text-xs text-text-muted">
              New to the platform?{" "}
              <Link href="/register" className="text-[#1E3A8A] font-extrabold hover:text-[#0891B2] hover:underline underline-offset-4 transition-colors">
                Create workspace
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

// 3. Create a new default export that wraps your logic in the Provider
export default function Login() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}