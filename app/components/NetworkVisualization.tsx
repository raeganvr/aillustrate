"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { NetworkLayer, NetworkModel } from "../types/NeuralNetwork";

interface NetworkVisualizationProps {
  model: NetworkModel;
  onNodeAdd?: (layerIndex: number) => void;
  onNodeRemove?: (layerIndex: number, nodeIndex: number) => void;
}

export function NetworkVisualization({ model, onNodeAdd, onNodeRemove }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dropTarget, setDropTarget] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ layerIndex: number; nodeIndex: number } | null>(null);

  const drawNetwork = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      layers: NetworkLayer[],
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const nodeRadius = 15;
      const layerSpacing = canvasWidth / (layers.length + 1);

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (isDragging) {
        layers.forEach((layer, i) => {
          if (i > 0 && i < layers.length - 1) {
            const x = layerSpacing * (i + 1);
            const width = nodeRadius * 4;
            ctx.fillStyle = "rgba(75, 85, 99, 0.2)";
            ctx.fillRect(x - width / 2, 0, width, canvasHeight);
          }
        });
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < layers.length - 1; i++) {
        const layer = layers[i];
        const nextLayer = layers[i + 1];
        const x1 = layerSpacing * (i + 1);
        const x2 = layerSpacing * (i + 2);

        for (let n1 = 0; n1 < layer.nodes; n1++) {
          const y1 = (canvasHeight / (layer.nodes + 1)) * (n1 + 1);
          for (let n2 = 0; n2 < nextLayer.nodes; n2++) {
            const y2 = (canvasHeight / (nextLayer.nodes + 1)) * (n2 + 1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      layers.forEach((layer, i) => {
        const x = layerSpacing * (i + 1);
        for (let j = 0; j < layer.nodes; j++) {
          const y = (canvasHeight / (layer.nodes + 1)) * (j + 1);
          const isHovered = hoveredNode?.layerIndex === i && hoveredNode?.nodeIndex === j;

          ctx.beginPath();
          ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);

          let fillColor = "";
          if (i === 0) {
            fillColor = "#f97316"; // orange-500
          } else if (i === layers.length - 1) {
            fillColor = "#3F0071"; // 
          } else {
            fillColor = isHovered ? "#ef4444" : "#3b82f6"; // red-500 on hover or blue-500
          }

          ctx.fillStyle = fillColor;
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      if (dropTarget) {
        ctx.beginPath();
        ctx.arc(dropTarget.x, dropTarget.y, nodeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#22c55e";
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [dropTarget, isDragging, hoveredNode]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      drawNetwork(ctx, model.layers, width, height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [model, drawNetwork]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawNetwork(ctx, model.layers, canvas.width, canvas.height);
  }, [model, drawNetwork]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeRadius = 15;
    const layerSpacing = canvas.width / (model.layers.length + 1);

    model.layers.forEach((layer, layerIndex) => {
      if (layerIndex === 0 || layerIndex === model.layers.length - 1) return;

      const layerX = layerSpacing * (layerIndex + 1);
      const nodeSpacing = canvas.height / (layer.nodes + 1);

      for (let nodeIndex = 0; nodeIndex < layer.nodes; nodeIndex++) {
        const nodeY = nodeSpacing * (nodeIndex + 1);
        const distance = Math.sqrt((x - layerX) ** 2 + (y - nodeY) ** 2);

        if (distance <= nodeRadius) {
          onNodeRemove?.(layerIndex, nodeIndex);
          return;
        }
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeRadius = 15;
    const layerSpacing = canvas.width / (model.layers.length + 1);

    let foundHover = false;
    model.layers.forEach((layer, layerIndex) => {
      if (layerIndex === 0 || layerIndex === model.layers.length - 1) return;

      const layerX = layerSpacing * (layerIndex + 1);
      const nodeSpacing = canvas.height / (layer.nodes + 1);

      for (let nodeIndex = 0; nodeIndex < layer.nodes; nodeIndex++) {
        const nodeY = nodeSpacing * (nodeIndex + 1);
        const distance = Math.sqrt((x - layerX) ** 2 + (y - nodeY) ** 2);

        if (distance <= nodeRadius) {
          setHoveredNode({ layerIndex, nodeIndex });
          foundHover = true;
          return;
        }
      }
    });

    if (!foundHover) setHoveredNode(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const layerSpacing = canvas.width / (model.layers.length + 1);
    const layerIndex = Math.floor((x / canvas.width) * model.layers.length);

    if (layerIndex > 0 && layerIndex < model.layers.length - 1) {
      const layerX = layerSpacing * (layerIndex + 1);
      setDropTarget({ x: layerX, y });
    } else {
      setDropTarget(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !dropTarget) return;

    const layerIndex = Math.floor((dropTarget.x / canvas.width) * model.layers.length);

    if (layerIndex > 0 && layerIndex < model.layers.length - 1) {
      onNodeAdd?.(layerIndex);
    }

    setIsDragging(false);
    setDropTarget(null);
  };

  return (
    <div className="relative w-full h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <div className="absolute top-4 left-4 flex gap-2">
        {model.layers.map((layer, i) => (
          <div
            key={i}
            className="bg-gray-800/80 px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg"
          >
            {layer.label}: {layer.nodes}
          </div>
        ))}
      </div>
    </div>
  );
}