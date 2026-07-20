"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

export default function ClientCallback({ code }) {
  const router = useRouter();
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div>Authenticating GitHub...</div>
    </div>
  );
}