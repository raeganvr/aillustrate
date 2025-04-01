"use client";
import Header from "./components/Header";
import Hero from "./components/Hero";
import NetworkAnimation from "./components/NetworkAnimation";
import Explore from "./components/Explore";

export default function Home() {
  return (
    <main className="relative bg-black text-white overflow-x-hidden scroll-smooth">
      {/* Parallax background animation */}
      <NetworkAnimation />

      {/* Navigation bar with gradient */}
      <Header />

      {/* Fullscreen hero section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center z-10">
        <Hero />
      </section>

      {/* Tutorial section (imported from Explore) */}
      <section
        id="tutorial-section"
        className="relative z-20  from-black via-gray-900 to-gray-950 py-20 px-4"
      >
        <Explore />
      </section>

      
    </main>
  );
}
