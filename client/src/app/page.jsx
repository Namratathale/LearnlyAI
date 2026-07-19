export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="bg-surface p-12 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-surface-light max-w-2xl w-full text-center transition-all">
        <h1 className="font-heading text-4xl text-primary mb-4 tracking-wide">
          AI Learning Platform
        </h1>
        <p className="font-sans text-text-muted text-lg mb-8 leading-relaxed">
          The workspace is initialized. The professional light theme and dual-font typography system are active and ready for development.
        </p>
        <button className="font-sans bg-accent text-white font-semibold py-3 px-8 rounded-md hover:bg-cyan-700 transition-colors shadow-sm">
          System Online
        </button>
      </div>
    </main>
  );
}