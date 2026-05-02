export default function Page() {
  return (
    <main className="min-h-screen text-white relative overflow-hidden bg-black">
      
      {/* фоновые glow-слои */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-black to-green-500/20 animate-pulse" />
      
      <div className="absolute inset-0 opacity-30 blur-3xl">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500 rounded-full mix-blend-screen animate-bounce" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-green-500 rounded-full mix-blend-screen animate-pulse" />
      </div>

      {/* header */}
      <header className="relative flex justify-between items-center px-8 py-6 z-10">
        <h1 className="text-2xl font-bold tracking-wide">
          levia.es
        </h1>

        <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 transition">
          Login
        </button>
      </header>

      {/* content */}
      <section className="relative flex flex-col items-center justify-center text-center h-[80vh] z-10">
        <h2 className="text-5xl font-bold mb-4 animate-pulse">
          Digital Experience Layer
        </h2>
        <p className="text-white/70 max-w-xl">
          Modern high-tech interface with dynamic breathing UI and immersive visual design.
        </p>
      </section>
    </main>
  );
}