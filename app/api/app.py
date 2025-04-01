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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List
import json

# --------------------------- FastAPI setup ---------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # for local development
        "https://interactive-ai-green.vercel.app"  # for production
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
trained_model = {"model": None, "X_val": None, "y_val": None, "dataset_name": None}

# --------------------------- Helper functions ---------------------------
def load_dataset(dataset_name: str, selected_features=None, test_size=0.4):
    if dataset_name == "boston":
        url = "https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv"
        df = pd.read_csv(url)
        all_features = list(df.columns[:-1])
        y = df.iloc[:, -1].values
    elif dataset_name == "california":
        data = fetch_california_housing()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        y = data.target
        all_features = list(data.feature_names)
    elif dataset_name == "diabetes":
        data = load_diabetes()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        y = data.target
        all_features = list(data.feature_names)
    elif dataset_name == "iris":
        data = load_iris()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        y = to_categorical(data.target)
        all_features = list(data.feature_names)
    else:
        return None, None, None, None, None

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

# --------------------------- Route: /train/init ---------------------------
@app.post("/train/init")
async def store_model(model: NetworkModel):
    cached_model["model"] = model
    return {"status": "Model stored"}

# --------------------------- Route: /train/stream ---------------------------
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
        "dataset_name": model.datasetName
    })

    def generate_events():
        for epoch in range(1, 21):
            history = nn_model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=1, verbose=0)
            yield f"data: {json.dumps({'epoch': epoch, 'loss': history.history['loss'][0], 'val_loss': history.history['val_loss'][0]})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate_events(), media_type="text/event-stream")

# --------------------------- Route: /train ---------------------------
@app.post("/train")
async def get_final_metrics():
    """
    Returns final accuracy or MAPE + loss after training is done.
    """
    model = cached_model.get("model")
    nn_model = trained_model.get("model")

    if not model or not nn_model:
        return {"error": "Model not initialized or trained"}

    dataset_name = model.datasetName

    # Load the same dataset and parameters
    selected_features = [param.label for param in model.parameters if param.selected]
    X_train, X_val, y_train, y_val, _ = load_dataset(dataset_name, selected_features, test_size=model.testSize)

    predictions = nn_model.predict(X_val)

    if dataset_name == "iris":
        predicted_labels = np.argmax(predictions, axis=1)
        true_labels = np.argmax(y_val, axis=1)
        accuracy = np.mean(predicted_labels == true_labels) * 100
        return {
            "accuracy": round(accuracy, 2),
            "loss": None  # Or send final val_loss if needed
        }
    else:
        y_val_flat = y_val.flatten() if len(y_val.shape) > 1 else y_val
        predictions_flat = predictions.flatten() if len(predictions.shape) > 1 else predictions
        mape = np.mean(np.abs((y_val_flat - predictions_flat) / (y_val_flat + 1e-8))) * 100
        return {
            "mape": round(mape, 2),
            "loss": None  # You can store the last val_loss in the stream if needed
        }

# --------------------------- Route: /train/final ---------------------------
@app.get("/train/final")
async def get_final_metrics():
    model = cached_model.get("model")
    if not model:
        return JSONResponse(content={"error": "Model not initialized"}, status_code=400)

    dataset_name = model.datasetName
    selected_features = [param.label for param in model.parameters if param.selected]
    X_train, X_val, y_train, y_val, input_dim = load_dataset(dataset_name, selected_features, test_size=model.testSize)

    if X_train is None:
        return {"error": "Invalid dataset or features selected."}

    output_size = 1 if dataset_name in ["boston", "california", "diabetes"] else 3
    nn_model = build_model(input_dim, [layer.nodes for layer in model.layers[1:-1]], output_size)

    history = nn_model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=20, verbose=0)

    loss_values = history.history.get("loss", [])
    val_loss_values = history.history.get("val_loss", [])
    predictions = nn_model.predict(X_val)

    if len(predictions.shape) == 1:  
        predictions = np.expand_dims(predictions, axis=1)
    if len(y_val.shape) == 1:
        y_val = np.expand_dims(y_val, axis=1)

    if dataset_name == "iris":
        predicted_labels = np.argmax(predictions, axis=1)
        true_labels = np.argmax(y_val, axis=1)
        accuracy = np.mean(predicted_labels == true_labels) * 100
        return {
            "accuracy": round(accuracy, 2),
            "loss": round(val_loss_values[-1], 4) if val_loss_values else None
        }
    else:
        y_val_flat = y_val.flatten() if len(y_val.shape) > 1 else y_val
        predictions_flat = predictions.flatten() if len(predictions.shape) > 1 else predictions
        mape = np.mean(np.abs((y_val_flat - predictions_flat) / (y_val_flat + 1e-8))) * 100
        return {
            "mape": round(mape, 2),
            "loss": round(val_loss_values[-1], 4) if val_loss_values else None
        }

# --------------------------- Route: /features ---------------------------
@app.get("/features/{dataset_name}")
async def get_features(dataset_name: str):
    X_train, X_val, y_train, y_val, input_dim = load_dataset(dataset_name)
    if X_train is None:
        return {"features": []}
    
    if dataset_name == "boston":
        url = "https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv"
        df = pd.read_csv(url)
        return {"features": list(df.columns[:-1])}
    elif dataset_name == "california":
        return {"features": list(fetch_california_housing().feature_names)}
    elif dataset_name == "diabetes":
        return {"features": list(load_diabetes().feature_names)}
    elif dataset_name == "iris":
        return {"features": list(load_iris().feature_names)}
    return {"features": []}

# --------------------------- Run server ---------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
