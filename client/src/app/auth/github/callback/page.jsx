import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export const dynamic = "force-dynamic";

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="relative z-10 bg-surface p-10 rounded-2xl shadow-2xl border border-surface-light text-center max-w-sm">
            <div className="w-12 h-12 border-4 border-surface-lighter border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-heading text-primary tracking-wide">
              Loading...
            </h2>
          </div>
        </div>
      }
    >
      <ClientCallback />
    </Suspense>
  );
}