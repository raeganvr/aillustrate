export interface NetworkLayer {
    nodes: number
    label: string
  }
  
  export interface NetworkParameter {
    id: string
    label: string
    selected: boolean
    range?: [number, number]
  }
  
  export interface NetworkModel {
    id: string
    name: string
    layers: NetworkLayer[]
    parameters: NetworkParameter[]
    accuracy?: number
    mape?: number
    loss?: number
    datasetName: string 
    testSize: number
  }
  
  export interface NetworkState {
    selectedModel: string
    models: NetworkModel[]
    isDragging: boolean
    draggedNode: { x: number; y: number } | null
  }
  
  