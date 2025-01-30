import Header from "./components/Header"
import Hero from "./components/Hero"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Header />
      <Hero />
    </main>
  )
}

