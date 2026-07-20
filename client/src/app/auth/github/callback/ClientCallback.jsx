"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import API from "@/lib/api";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function ClientCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    if (!code) {
      router.replace("/login");
      return;
    }

    hasFetched.current = true;

    API.post("/auth/github", { code })
      .then(({ data }) => {
        if (data?.status === "success" && data?.data?.token) {
          localStorage.setItem("token", data.data.token);
          router.replace("/dashboard");
        } else {
          router.replace("/login?error=github_failed");
        }
      })
      .catch((err) => {
        console.error("GitHub auth failed:", err);
        router.replace("/login?error=github_failed");
      });
  }, [code, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative font-sans">
      <AnimatedBackground />

      <div className="relative z-10 bg-surface p-10 rounded-2xl shadow-2xl border border-surface-light text-center max-w-sm">
        <div className="w-12 h-12 border-4 border-surface-lighter border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-heading text-primary tracking-wide">
          Authenticating GitHub...
        </h2>
        <p className="text-text-muted mt-3 text-sm font-medium">
          Establishing secure session protocols.
        </p>
      </div>
    </div>
  );
}