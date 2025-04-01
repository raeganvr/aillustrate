"use client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center">
      {/* Translucent bar with brand & nav */}
      <div className="w-full flex justify-between items-center px-6 py-4 backdrop-blur-md bg-black/50 border-b border-white/10">
        <div
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          <span className="text-blue-500">AI</span>llustrate
        </div>
        <nav className="space-x-4 text-lg tracking-wider">
          <button
            onClick={() => router.push("/tool")}
            className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          >
            Tool
          </button>
          <button
            onClick={() => {
              const section = document.getElementById("tutorial-section");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          >
            Tutorial
          </button>
        </nav>
      </div>

      {/* Gradient separator */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-500/50 via-transparent to-black/50" />
    </header>
  );
}
