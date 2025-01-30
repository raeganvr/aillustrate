"use client";
import { useRouter } from "next/navigation";

export default function Hero() {
    const router = useRouter();

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-sm mb-2 opacity-70 tracking-widest">RAEGAN VAN RAAMSDONK</h2>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-wide">
          BUILD AND EXPLORE
          <br />
          NEURAL NETWORKS
        </h1>
        <button 
            className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
            onClick={() => router.push("/explore")}
        >
          EXPLORE
        </button>
      </div>
    )
  }
  
  