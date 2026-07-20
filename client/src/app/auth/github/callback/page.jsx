import ClientCallback from "./ClientCallback";

export const dynamic = "force-dynamic";

export default function GitHubCallbackPage({ searchParams }) {
  const code = searchParams?.code || null;

  return <ClientCallback code={code} />;
}