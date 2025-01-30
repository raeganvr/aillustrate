"use client";
import NeuralNetwork from "../components/NeuralNetwork";

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">Interactive Neural Network</h1>
      <NeuralNetwork />
    </main>
  );
}
