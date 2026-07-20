// Notice there is NO "use client" here!
import ClientCallback from "./ClientCallback";

// This safely tells Vercel's server to skip building this page during deployment
export const dynamic = "force-dynamic";

export default function GitHubCallbackPage() {
  return <ClientCallback />;
}