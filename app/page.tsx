export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center">

      {/* animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-red-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-green-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black opacity-80" />
      </div>

      {/* noise / tech overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center px-8 py-6 z-10">
        <h1 className="text-xl font-semibold tracking-widest">
          levia.es
        </h1>

        <button className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur hover:bg-white/10 transition">
          Login
        </button>
      </header>

      {/* center content */}
      <section className="relative z-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight animate-pulse">
          Breathing Interface
        </h1>
        <p className="mt-4 text-white/60 max-w-md mx-auto">
          A living UI system with continuous motion, glow and adaptive depth.
        </p>
      </section>

    </main>
  );
}