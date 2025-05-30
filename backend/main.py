import tensorflow as tf
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import to_categorical  
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import fetch_california_housing, load_diabetes, load_iris

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List
from functools import lru_cache
import json

# --------------------------- FastAPI setup ---------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://aillustrate.dev",        
        "https://www.aillustrate.dev",    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------- Data models ---------------------------
class Layer(BaseModel):
    nodes: int
    label: str

class Parameter(BaseModel):
    id: str
    label: str
    selected: bool

class NetworkModel(BaseModel):
    id: str
    name: str
    layers: List[Layer]
    parameters: List[Parameter]
    datasetName: str = "boston"
    testSize: float = 0.4

# --------------------------- Global state ---------------------------
cached_model = {"model": None}
trained_model = {"model": None, "X_val": None, "y_val": None, "dataset_name": None, "val_loss": None}

# --------------------------- Helper functions ---------------------------
@lru_cache(maxsize=4)
def get_cached_dataset(name: str):
    if name == "boston":
        df = pd.read_csv("https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv")
        return df, list(df.columns[:-1]), df.columns[-1]
    elif name == "california":
        data = fetch_california_housing()
        return pd.DataFrame(data.data, columns=data.feature_names), data.feature_names, "target"
    elif name == "diabetes":
        data = load_diabetes()
        return pd.DataFrame(data.data, columns=data.feature_names), data.feature_names, "target"
    elif name == "iris":
        data = load_iris()
        return pd.DataFrame(data.data, columns=data.feature_names), data.feature_names, "target"
    return None, None, None

def load_dataset(dataset_name: str, selected_features=None, test_size=0.4):
    df, all_features, target_column = get_cached_dataset(dataset_name)
    if df is None:
        return None, None, None, None, None

    if dataset_name == "iris":
        y = to_categorical(load_iris().target)
    elif dataset_name == "boston":
        y = df[target_column].values
    elif dataset_name == "california":
        y = fetch_california_housing().target  # ✅ was using wrong column before
    elif dataset_name == "diabetes":
        y = load_diabetes().target  # ✅ fix for real target
    else:
        y = df.iloc[:, -1].values

    if selected_features:
        valid = [f for f in selected_features if f in all_features]
        if not valid:
            return None, None, None, None, None
        X = df[valid].values
        input_dim = len(valid)
    else:
        X = df.values
        input_dim = len(all_features)

    X = StandardScaler().fit_transform(X)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=test_size, random_state=42)
    return X_train, X_val, y_train, y_val, input_dim

def build_model(input_dim, hidden_layers, output_size):
    model = Sequential()
    model.add(Input(shape=(input_dim,)))
    for n in hidden_layers:
        model.add(Dense(n, activation='relu'))

    if output_size == 1:
        model.add(Dense(output_size, activation="linear"))
        model.compile(optimizer=Adam(learning_rate=0.01), loss="mse", metrics=["mae"])
    else:
        model.add(Dense(output_size, activation="softmax"))
        model.compile(optimizer=Adam(learning_rate=0.01), loss="categorical_crossentropy", metrics=["accuracy"])
    return model

# --------------------------- Routes ---------------------------

@app.post("/train/init")
async def store_model(model: NetworkModel):
    cached_model["model"] = model
    return {"status": "Model stored"}

@app.get("/train/stream")
def train_model_stream():
    model = cached_model.get("model")
    if not model:
        return JSONResponse(content={"error": "Model not initialized"}, status_code=400)

    X_train, X_val, y_train, y_val, input_dim = load_dataset(
        model.datasetName,
        [p.label for p in model.parameters if p.selected],
        test_size=model.testSize
    )
    if X_train is None:
        return JSONResponse(content={"error": "Invalid dataset/parameters"}, status_code=400)

    output_size = 1 if model.datasetName in ["boston", "california", "diabetes"] else 3
    nn_model = build_model(input_dim, [l.nodes for l in model.layers[1:-1]], output_size)

    trained_model.update({
        "model": nn_model,
        "X_val": X_val,
        "y_val": y_val,
        "dataset_name": model.datasetName,
        "val_loss": None
    })

    def generate_events():
        for epoch in range(1, 21):
            history = nn_model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=1, verbose=0)
            trained_model["val_loss"] = history.history["val_loss"][0]
            yield f"data: {json.dumps({'epoch': epoch, 'loss': history.history['loss'][0], 'val_loss': history.history['val_loss'][0]})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate_events(), media_type="text/event-stream")

@app.post("/train")
async def get_final_metrics():
    model = cached_model.get("model")
    nn_model = trained_model.get("model")
    if not model or not nn_model:
        return {"error": "Model not initialized or trained"}

    predictions = nn_model.predict(trained_model["X_val"])
    y_val = trained_model["y_val"]
    dataset_name = trained_model["dataset_name"]
    val_loss = trained_model["val_loss"]

    if dataset_name == "iris":
        predicted_labels = np.argmax(predictions, axis=1)
        true_labels = np.argmax(y_val, axis=1)
        accuracy = np.mean(predicted_labels == true_labels) * 100
        return {"accuracy": round(accuracy, 2), "loss": round(val_loss, 4) if val_loss else None}
    else:
        y_val_flat = y_val.flatten() if len(y_val.shape) > 1 else y_val
        predictions_flat = predictions.flatten() if len(predictions.shape) > 1 else predictions
        mape = np.mean(np.abs((y_val_flat - predictions_flat) / (y_val_flat + 1e-8))) * 100
        return {"mape": round(mape, 2), "loss": round(val_loss, 4) if val_loss else None}

@app.get("/features/{dataset_name}")
async def get_features(dataset_name: str):
    df, all_features, _ = get_cached_dataset(dataset_name)
    return {"features": all_features if all_features else []}

# --------------------------- Run server ---------------------------
if __name__ == "__main__":
    import uvicorn, os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
