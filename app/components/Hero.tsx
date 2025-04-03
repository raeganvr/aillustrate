"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Hero() {
  const router = useRouter();

  const pingBackend = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/`);
      const data = await res.json();
      alert(`Message from backend: ${data.message}`);
    } catch (err) {
      alert("Failed to reach backend.");
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
      <motion.h2
        className="text-sm mb-2 opacity-70 tracking-widest"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        RAEGAN VAN RAAMSDONK
      </motion.h2>
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-wide"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        BUILD AND EXPLORE
        <br />
        NEURAL NETWORKS
      </motion.h1>
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          onClick={() => router.push("/tool")}
        >
          LAUNCH TOOL
        </button>
        <button
          className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          onClick={() => {
            const section = document.getElementById("tutorial-section");
            if (section) section.scrollIntoView({ behavior: "smooth" });
          }}
        >
          LEARN MORE
        </button>
        <button
          className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          onClick={pingBackend}
        >
          PING BACKEND
        </button>
      </motion.div>
    </div>
  );
}
