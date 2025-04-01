"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NetworkVisualization } from "./NetworkVisualization";
import { NetworkSidebar, DatasetOption } from "./NetworkSidebar";
import type { NetworkModel } from "../types/NeuralNetwork";

export default function NetworkPage() {
  const router = useRouter();
  
  const [model, setModel] = useState<NetworkModel>({
    id: "1",
    name: "Model 1",
    layers: [
      { nodes: 0, label: "Input" },  
      { nodes: 13, label: "Layer 1" },
      { nodes: 12, label: "Layer 2" },
      { nodes: 1, label: "Output" },
    ],
    parameters: [],
    datasetName: "boston",
    testSize: 0.4,
  });

  // Define dataset options for the sidebar
  const datasetOptions: DatasetOption[] = [
    {
      abbreviation: "boston",
      name: "Boston Housing",
    },
  
    {
      abbreviation: "california",
      name: "California Housing",
    },
  
    {
      abbreviation: "diabetes",
      name: "Diabetes Progression",
    },
  
    {
      abbreviation: "iris",
      name: "Iris Classification",
    },
  ];

  // Fetch dataset features only once when the component mounts
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        // Optionally, update the URL to include the selected dataset:
        const response = await fetch(`http://127.0.0.1:8000/features/${model.datasetName}`);
        const data = await response.json();

        setModel((prevModel) => ({
          ...prevModel,
          parameters: data.features?.map((feature: string) => ({
            id: feature,
            label: feature,
            selected: false, // Start with all unselected
          })),
        }));
      } catch (error) {
        console.error("Error fetching features:", error);
      }
    };

    fetchFeatures();
  }, [model.datasetName]); 

  // Update the input layer dynamically based on selected parameters
  useEffect(() => {
    const selectedInputs = model.parameters?.filter((param) => param.selected).length;
    setModel((prevModel) => ({
      ...prevModel,
      layers: [{ ...prevModel.layers[0], nodes: selectedInputs }, ...prevModel.layers.slice(1)],
    }));
  }, [model.parameters]);

  // Handle toggling parameters dynamically
  const handleParameterToggle = (parameterId: string) => {
    setModel((prev) => ({
      ...prev,
      parameters: prev.parameters.map((param) =>
        param.id === parameterId ? { ...param, selected: !param.selected } : param
      ),
    }));
  };

  const handleAddLayer = () => {
    setModel((prev) => ({
      ...prev,
      layers: [
        ...prev.layers.slice(0, -1),
        { nodes: 8, label: `Layer ${prev.layers.length - 2}` },
        prev.layers[prev.layers.length - 1],
      ],
    }));
  };
  
  const handleRemoveLayer = () => {
    if (model.layers.length <= 3) return; // Keep at least input & output layers
    setModel((prev) => ({
      ...prev,
      layers: [...prev.layers.slice(0, -2), prev.layers[prev.layers.length - 1]],
    }));
  };
  
  const handleNodeAdd = (layerIndex: number) => {
    setModel((prev) => ({
      ...prev,
      layers: prev.layers.map((layer, i) =>
        i === layerIndex ? { ...layer, nodes: layer.nodes + 1 } : layer
      ),
    }));
  };
  
  const handleNodeRemove = (layerIndex: number, nodeIndex: number) => {
    setModel((prev) => ({
      ...prev,
      layers: prev.layers.map((layer, i) =>
        i === layerIndex ? { ...layer, nodes: Math.max(1, layer.nodes - 1) } : layer
      ),
    }));
  };
  
  const [lossGraphData, setLossGraphData] = useState<{ epoch: number; loss: number; val_loss: number }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const handleTrain = async () => {
    const hasSelectedParams = model.parameters?.some((param) => param.selected);
    if (!hasSelectedParams) {
      alert("Please select at least one input parameter before training.");
      return;
    }
  
    setIsTraining(true);
    setLossGraphData([]);

    try {
      // 1. Init model on backend
      const initRes = await fetch("http://127.0.0.1:8000/train/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model),
      });

      if (!initRes.ok) {
        throw new Error(`Init failed: ${initRes.status}`);
      }

      // 2. Begin streaming training updates
      const eventSource = new EventSource("http://127.0.0.1:8000/train/stream");
      const updates: { epoch: number; loss: number; val_loss: number }[] = [];

      eventSource.onmessage = async (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.done) {
            eventSource.close();
            setIsTraining(false);

            // 3. Once stream is done, fetch final metrics
            const finalRes = await fetch("http://127.0.0.1:8000/train/final");
            const finalData = await finalRes.json();

            setModel((prev) => ({
              ...prev,
              accuracy: finalData.accuracy,
              mape: finalData.mape,
              loss: finalData.loss,
            }));

            return;
          }

          updates.push(parsed);
          setLossGraphData([...updates]);
        } catch (err) {
          console.error("Failed to parse SSE data:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        eventSource.close();
        setIsTraining(false);
      };
    } catch (error) {
      console.error("Error during training:", error);
      setIsTraining(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header with Navigation */}
      <header className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-75 backdrop-blur-md shadow-md border-b border-white/10 z-20">
        <div
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          <span className="text-blue-500">AI</span>llustrate
        </div>
        <div className="space-x-4">
          <button 
            onClick={() => router.push("/")} 
            className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-sm tracking-widest"
          >
            Home
          </button>
        </div>
      </header>
      <div className="w-full h-1 bg-gradient-to-r from-blue-500/50 via-transparent to-black/50" />

      {/* Main Content Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with its own scrolling */}
        <div className="w-80 overflow-y-auto">
          <NetworkSidebar
            model={model}
            onParameterToggle={handleParameterToggle}
            onAddLayer={handleAddLayer}
            onRemoveLayer={handleRemoveLayer}
            onTrain={handleTrain}
            lossGraphData={lossGraphData}
            datasetOptions={datasetOptions}
            selectedDataset={model.datasetName}
            onDatasetChange={(datasetName: string) =>
              setModel((prev) => ({ ...prev, datasetName }))
            }
            testSizePercent={model.testSize * 100}
            onTestSizeChange={(pct: number) =>
              setModel((prev) => ({ ...prev, testSize: pct / 100 }))
            }
          />
        </div>

        {/* Visualization area remains fixed without scrolling */}
        <main className="flex-1 p-4 overflow-hidden">
          <NetworkVisualization 
            model={model} 
            onNodeAdd={handleNodeAdd} 
            onNodeRemove={handleNodeRemove} 
          />
        </main>
      </div>
    </div>
  );
}
