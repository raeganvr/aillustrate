"use client";

import { useState } from "react";

interface DraggableNodeProps {
  onDragStart: (e: React.DragEvent) => void;
}

export function DraggableNode({ onDragStart }: DraggableNodeProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "node" }));
    onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative group w-fit py-2">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`w-8 h-8 rounded-full cursor-grab transition-all duration-300 transform 
          ${isDragging ? "opacity-50 scale-90" : "hover:scale-110"} 
          border border-blue-100 shadow-md`}
        style={{
          background: "radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6)",
          boxShadow: "0 0 6px rgba(59, 130, 246, 0.6)",
        }}
      />
    </div>
  );
}
