"use client";

import { useState } from "react";
import type { NetworkModel } from "../types/NeuralNetwork";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Plus, Minus } from "lucide-react";
import { DraggableNode } from "./DraggableNode";
import LossGraph from "./LossGraph";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { featureLabelMap, toTitleCase } from "../utils/featureLabelMap";

export interface DatasetOption {
  abbreviation: string;
  name: string;
}

interface NetworkSidebarProps {
  model: NetworkModel;
  onParameterToggle: (parameterId: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: () => void;
  onTrain: () => void;
  lossGraphData: { epoch: number; loss: number; val_loss: number }[];
  datasetOptions: DatasetOption[];
  selectedDataset: string;
  onDatasetChange: (dataset: string) => void;

  testSizePercent: number;                 // e.g. 40 means 40%
  onTestSizeChange: (pct: number) => void; // callback to update
}

export function NetworkSidebar({
  model,
  onParameterToggle,
  onAddLayer,
  onRemoveLayer,
  onTrain,
  lossGraphData,
  datasetOptions,
  selectedDataset,
  onDatasetChange,

  // new props
  testSizePercent,
  onTestSizeChange,
}: NetworkSidebarProps) {
  const [showModal, setShowModal] = useState(false);
  const [showTestSizeInfo, setShowTestSizeInfo] = useState(false); // info for the test size slider

  const selectedInputs = model.parameters?.filter((param) => param.selected).length;
  const allSelected = !!model.parameters?.length && model.parameters.every((p) => p.selected);

  // Current dataset details (for the "Info" modal)
  const currentDataset = datasetOptions.find((ds) => ds.abbreviation === selectedDataset);

  // Toggle All Input Parameters
  const handleToggleAll = () => {
    model.parameters?.forEach((param) => {
      const shouldSelect = !allSelected;
      if (param.selected !== shouldSelect) {
        onParameterToggle(param.id);
      }
    });
  };

  return (
    <div className="w-80 bg-gradient-to-b from-gray-900 to-black p-4 flex flex-col gap-4 shadow-xl overflow-y-auto h-full rounded-r-xl transition-colors duration-300">
      {/* Dataset Selection */}
      <div className="flex flex-col gap-2 mb-4">
        <Label htmlFor="dataset-select" className="text-white font-semibold">
          Select Dataset:
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="dataset-select"
            className="bg-gray-800 text-white p-2 rounded flex-grow"
            value={selectedDataset}
            onChange={(e) => onDatasetChange(e.target.value)}
          >
            {datasetOptions.map((option) => (
              <option key={option.abbreviation} value={option.abbreviation}>
                {option.name}
              </option>
            ))}
          </select>
          <Button 
            className="bg-black"
            variant="outline" 
            onClick={() => setShowModal(true)}>
              Info
          </Button>
        </div>
      </div>

      {/* Modal for Dataset Description */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-900 p-6 rounded-xl shadow-2xl w-[700px] max-w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-2xl font-semibold mb-4 border-b border-white/10 pb-2">
              {selectedDataset === "boston" && "Boston Housing"}
              {selectedDataset === "california" && "California Housing"}
              {selectedDataset === "diabetes" && "Diabetes Progression"}
              {selectedDataset === "iris" && "Iris Classification"}
            </h3>

            <div className="text-gray-300 text-sm leading-relaxed space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              {selectedDataset === "boston" && (
                <>
                  <p>
                    <strong className="text-white">Description:</strong> The Boston Housing dataset contains
                    information about housing in the Boston area, including various
                    features that can be used to predict housing prices.
                  </p>
                  <p>
                    <strong className="text-white">Goal:</strong> Predict median housing prices (in $1000s) in
                    various Boston suburbs.
                  </p>
                  <div>
                    <strong className="text-white">Inputs (13 features):</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>CRIM: Per capita crime rate</li>
                      <li>ZN: Residential land zoned for large lots</li>
                      <li>INDUS: Non-retail business acres per town</li>
                      <li>CHAS: Charles River dummy (1 if bounds river)</li>
                      <li>NOX: Nitric oxide concentration</li>
                      <li>RM: Average number of rooms per dwelling</li>
                      <li>AGE: % of owner-occupied units built before 1940</li>
                      <li>DIS: Distances to employment centers</li>
                      <li>RAD: Accessibility to radial highways</li>
                      <li>TAX: Property-tax rate per $10k</li>
                      <li>PTRATIO: Pupil-teacher ratio</li>
                      <li>B: 1000(Bk - 0.63)^2 for Black population</li>
                      <li>LSTAT: % Lower status of the population</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">Expected Performance:</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>MAE: ~2–4 (i.e. $2k–$4k off)</li>
                      <li>MAPE: ~10–20% typical</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedDataset === "california" && (
                <>
                  <p>
                    <strong className="text-white">Description:</strong> The California Housing dataset uses
                    census data from block groups to predict median house values in
                    different California districts.
                  </p>
                  <p>
                    <strong className="text-white">Goal:</strong> Predict median house values (in 1000s) based
                    on features like median income, average rooms, etc.
                  </p>
                  <div>
                    <strong className="text-white">Inputs (8 features):</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>MedInc: Median income</li>
                      <li>HouseAge: Median house age</li>
                      <li>AveRooms: Average rooms per household</li>
                      <li>AveBedrms: Average bedrooms per household</li>
                      <li>Population: Total population in block group</li>
                      <li>AveOccup: Average household size</li>
                      <li>Latitude</li>
                      <li>Longitude</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">Expected Performance:</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>MAE ~0.5–0.8 (depending on scaling)</li>
                      <li>MAPE ~15–25% for typical models</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedDataset === "diabetes" && (
                <>
                  <p>
                    <strong className="text-white">Description:</strong> The Diabetes dataset is a set of
                    health-related measurements from diabetes patients used to
                    predict a disease progression metric 1 year after baseline.
                  </p>
                  <p>
                    <strong className="text-white">Goal:</strong> Predict disease progression measure (numeric)
                    for diabetes patients.
                  </p>
                  <div>
                    <strong className="text-white">Inputs (10 features):</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>Age (centered)</li>
                      <li>Sex (male/female encoded)</li>
                      <li>BMI (body mass index)</li>
                      <li>BP (average blood pressure)</li>
                      <li>S1–S6: Various serum measurements</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">Expected Performance:</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>MAE ~40–60 on standard scale</li>
                      <li>MSE or MAE depends heavily on train/test split</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedDataset === "iris" && (
                <>
                  <p>
                    <strong className="text-white">Description:</strong> The Iris dataset is a simple dataset
                    with measurements of iris flowers of three species: Setosa,
                    Versicolor, and Virginica.
                  </p>
                  <p>
                    <strong className="text-white">Goal:</strong> Classify the species of iris flower based on
                    sepal and petal measurements.
                  </p>
                  <div>
                    <strong className="text-white">Inputs (4 features):</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">                      <li>Sepal length (cm)</li>
                      <li>Sepal width (cm)</li>
                      <li>Petal length (cm)</li>
                      <li>Petal width (cm)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">Expected Performance:</strong>
                    <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                      <li>Accuracy: ~94–100% (very easily separated classes)</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <Button
                className="bg-black text-white border border-white hover:bg-white hover:text-black transition-all"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
           
          </div>
        </div>
      )}


        {/*  Test Size Slider */}
      <div className="flex flex-col gap-2 mb-4">
      <Label htmlFor="test-size-slider" className="text-white font-semibold">
        Test Size: {testSizePercent.toFixed(0)}%
      </Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            id="test-size-slider"
            className="w-full accent-violet-500"
            min={10}
            max={90}
            step={5}
            value={testSizePercent}
            onChange={(e) => onTestSizeChange(Number(e.target.value))}
          />
          <Button 
            variant="outline" 
            className="bg-black" 
            onClick={() => setShowTestSizeInfo(true)}>
              Info
          </Button>
        </div>
      </div>

      {/* Modal for Test Size Info */}
      {showTestSizeInfo && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowTestSizeInfo(false)}
        >
          <div
            className="bg-zinc-900 p-6 rounded-xl shadow-2xl max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-2xl font-semibold mb-4 border-b border-white/10 pb-2">
              Test Size Explanation
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              This slider sets what percentage of your data is used for testing.
              A larger test set means less data to train on, making it harder for the model to learn —
              but it gives you a more robust evaluation of how well the model generalizes.
            </p>
            <div className="mt-6 flex justify-end">
              <Button
                className="bg-black text-white border border-white hover:bg-white hover:text-black transition-all"
                variant="outline"
                onClick={() => setShowTestSizeInfo(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Model Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">{model.name}</h2>
        {model.accuracy !== undefined ? (
          <div className="flex justify-between text-sm">
            <span className="text-green-400">Accuracy: {model.accuracy}%</span>
            {model.loss !== undefined && (
              <span className="text-red-400">Loss: {model.loss}</span>
            )}
          </div>
        ) : model.mape !== undefined && model.loss !== undefined ? (
          <div className="flex justify-between text-sm">
            <span className="text-green-400">
              Mean Absolute Error Percentage: {model.mape}%
            </span>
            <span className="text-red-400">Loss: {model.loss}</span>
          </div>
        ) : null}
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* Input Parameters */}
        <AccordionItem value="input-parameters">
          <AccordionTrigger className="text-white">Input Parameters</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleToggleAll}
                className="w-full bg-slate-800"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>

              {model.parameters?.map((param) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between bg-gray-800 p-2 rounded-lg"
                >
                  <Label
                    htmlFor={param.id}
                    className="text-sm text-white cursor-pointer flex-grow"
                  >
                    {featureLabelMap[model.datasetName]?.[param.id] ?? toTitleCase(param.id)}
                  </Label>
                  <Switch
                    id={param.id}
                    checked={param.selected}
                    onCheckedChange={() => onParameterToggle(param.id)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              ))}

            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Hidden Layers */}
        <AccordionItem value="hidden-layers">
          <AccordionTrigger className="text-white">Hidden Layers</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Layers: {model.layers.length - 2}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRemoveLayer}
                  className="bg-red-500 hover:bg-red-600 text-white h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onAddLayer}
                  className="bg-green-500 hover:bg-green-600 text-white h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Draggable Nodes */}
        <AccordionItem value="add-nodes">
          <AccordionTrigger className="text-white">Add Nodes</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col items-center gap-2">
              <DraggableNode onDragStart={() => {}} />
              <p className="text-xs text-gray-400 text-center">
                Drag and drop to add nodes to hidden layers
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        
        
      </Accordion>
        
        {/* Loss Graph */}
      <div className="mt-4">
        <LossGraph lossData={lossGraphData} />
      </div>

      <Button className="mt-auto bg-blue-500 hover:bg-blue-600 text-white" onClick={onTrain}>
        Train Model
      </Button>
    </div>
  );
}
