"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import API from "@/lib/api";
import AnimatedBackground from "@/components/AnimatedBackground";

export const dynamic = "force-dynamic";

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  
  // Prevent strict-mode double firing during development
  const hasFetched = useRef(false);

  useEffect(() => {
    if (code && !hasFetched.current) {
      hasFetched.current = true;
      
      API.post('/auth/github', { code })
        .then(({ data }) => {
          if (data.status === 'success') {
            localStorage.setItem('token', data.data.token);
            router.push('/dashboard');
          }
        })
        .catch((err) => {
          console.error(err);
          // Redirect back to login with an error flag if it fails
          router.push('/login?error=github_failed');
        });
    } else if (!code) {
      router.push('/login');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative font-sans">
      <AnimatedBackground />
      <div className="relative z-10 bg-surface p-10 rounded-2xl shadow-2xl border border-surface-light text-center max-w-sm">
        {/* Animated Loading Spinner */}
        <div className="w-12 h-12 border-4 border-surface-lighter border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-heading text-primary tracking-wide">Authenticating GitHub...</h2>
        <p className="text-text-muted mt-3 text-sm font-medium">Establishing secure session protocols.</p>
      </div>
    </div>
  );
}