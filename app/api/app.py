import tensorflow as tf
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def get_user_input(prompt, valid_options=None, input_type=str, min_val=None, max_val=None):
    """
    Gets valid user input from the console.
    
    Parameters:
        prompt (str): The prompt to display to the user.
        valid_options (iterable, optional): A collection of valid string options.
        input_type (type, optional): The expected data type (str, int, or float).
        min_val (int or float, optional): The minimum allowed value (for numeric inputs).
        max_val (int or float, optional): The maximum allowed value (for numeric inputs).
    
    Returns:
        The user input converted to the specified type if it passes validation.
    """
    while True:
        user_input = input(f"{prompt} ").strip()
        
        if input_type == str:
            user_input = user_input.lower()
        
        try:
            if input_type == int:
                if not user_input.isdigit():
                    raise ValueError("Please enter a valid integer.")
                user_input = int(user_input)
            elif input_type == float:
                user_input = float(user_input)
            
            if (min_val is not None and user_input < min_val) or (max_val is not None and user_input > max_val):
                print(f"Invalid input. Please enter a value between {min_val} and {max_val}.")
                continue
        except ValueError:
            print(f"Invalid input. Please enter a valid {input_type.__name__}.")
            continue
        
        if valid_options is not None and str(user_input) not in valid_options:
            print(f"Invalid input. Choose from {valid_options}.")
            continue
        
        return user_input

def select_dataset():
    """
    Prompts the user to select a dataset.
    
    Returns:
        str: The selected dataset identifier ("boston_housing" or "titanic_survival").
    """
    datasets = {
        "1": "boston_housing",
        "2": "titanic_survival"
    }
    choice = get_user_input("Choose a dataset (1 for Boston Housing, 2 for Titanic Survival):", datasets.keys())
    return datasets[str(choice)]


def select_features(dataset):
    """
    Loads the dataset and prompts the user to select features.
    
    For each dataset, a mapping is built to allow case-insensitive matching.
    
    Parameters:
        dataset (str): The dataset identifier.
    
    Returns:
        tuple: (df, features) where df is the DataFrame and features is a list of selected column names.
    """
    if dataset == "boston_housing":
        url = "https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv"
        df = pd.read_csv(url)
        valid_features = list(df.columns[:-1])

        mapping = {feature.lower(): feature for feature in valid_features}
                
        print("\nAvailable Features:", valid_features)
        
        while True:
            user_input = input("Enter feature names separated by commas (or type 'all' to use all features): ").strip()
            if user_input.lower() == "all":
                return df, valid_features

            selected = [f.strip().lower() for f in user_input.split(",")]
            if all(f in mapping for f in selected):
                selected_features = [mapping[f] for f in selected]
                return df, selected_features
            print("Invalid feature selection. Please choose from:", valid_features)
    
    elif dataset == "titanic_survival":
        url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
        df = pd.read_csv(url)
        valid_features = ["Pclass", "Age", "SibSp", "Parch", "Fare"]
        mapping = {feat.lower(): feat for feat in valid_features}
        print("\nAvailable Features for Titanic Survival:", valid_features)
        
        while True:
            user_input = input("Enter feature names separated by commas (or type 'all' to use all features): ").strip()
            if user_input.lower() == "all":
                return df, valid_features
            selected = [f.strip().lower() for f in user_input.split(",")]
            if all(f in mapping for f in selected):
                selected_features = [mapping[f] for f in selected]
                return df, selected_features
            print("Invalid feature selection. Please choose from:", valid_features)
    
    return None, None


def build_model(input_dim, hidden_layers, output_size, output_activation):
    """
    Builds and compiles a feedforward neural network based on user input.
    
    Parameters:
        input_dim (int): Number of input features.
        hidden_layers (list of int): Neurons in each hidden layer.
        output_size (int): Neurons in the output layer.
        output_activation (str): Activation function for the output layer.
    
    Returns:
        tf.keras.Model: The compiled neural network model.
    """
    model = Sequential([
        Input(shape=(input_dim,))
    ])
    
    for neurons in hidden_layers:
        model.add(Dense(neurons, activation='relu'))
    
    model.add(Dense(output_size, activation=output_activation))
    
    if output_activation == "linear":
        loss = "mse"
        metrics = ["mae"]
    elif output_activation == "sigmoid":
        loss = "binary_crossentropy"
        metrics = ["accuracy"]
    else:
        loss = "sparse_categorical_crossentropy"
        metrics = ["accuracy"]
    
    model.compile(optimizer=Adam(learning_rate=0.01), loss=loss, metrics=metrics)
    return model

def train_model(model, X_train, y_train, X_val, y_val, epochs=20):
    """
    Trains the model.
    
    Parameters:
        model (tf.keras.Model): The model to train.
        X_train (array): Training input data.
        y_train (array): Training target data.
        X_val (array): Validation input data.
        y_val (array): Validation target data.
        epochs (int): Maximum number of training epochs.
    
    Returns:
        History: The training history object.
    """
    # If validation loss stops decreasing while training loss keeps improving, the model is overfitting.

    early_stopping = EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True)
    history = model.fit(X_train, y_train, validation_data=(X_val, y_val),
                        epochs=epochs, verbose=1, callbacks=[early_stopping])
    return history

def evaluate_model(model, X_val, y_val, dataset_type):
    """
    Evaluates the trained model on the validation set and prints accuracy metrics.
    
    Parameters:
        model (tf.keras.Model): The trained model.
        X_val (array): Validation input data.
        y_val (array): Validation target data.
        dataset_type (str): Identifier for the dataset type.
    """
    results = model.evaluate(X_val, y_val, verbose=0)
    
    if dataset_type == "titanic_survival":
        accuracy = results[1]  # Accuracy metric from model
        print(f"\nFinal Validation Accuracy: {accuracy * 100:.2f}%")
    elif dataset_type == "boston_housing":
        mae = results[1]  # Mean Absolute Error
        mean_value = np.mean(y_val)
        accuracy = 100 - ((mae / mean_value) * 100)  
        
        print(f"\nEstimated Accuracy: {accuracy:.2f}% (based on MAE)")



# Data Metrics

def plot_loss(history):
    """
    Plots the training and validation loss over epochs.
    
    Parameters:
        history: The training history object.
    """
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.title('Training Progress')
    plt.show()

def predict_samples(model, X_val, y_val, dataset_type, num_samples=5):
    """
    Generates predictions on a set of validation samples and prints the results.
    
    For Boston Housing, prints:
        - Actual Price (converted to USD)
        - Predicted Price (converted to USD)
        - Accuracy percentage calculated as 100 - (|actual - predicted|/actual * 100)
    
    For Titanic Survival, prints:
        - Actual class
        - Predicted probability
        - Predicted class (1 if predicted probability >= 0.5, else 0)
        - Correctness percentage (100 if prediction is correct, else 0)
    
    Parameters:
        model (tf.keras.Model): The trained model.
        X_val (array): Validation input data.
        y_val (array): Validation target data.
        dataset_type (str): Identifier for the dataset.
        num_samples (int): Number of samples to predict.
    """
    sample_indices = np.random.choice(len(X_val), num_samples, replace=False)
    sample_inputs = X_val[sample_indices]
    predictions = model.predict(sample_inputs)

    print("\nPredictions on 5 Validation Samples:")
    
    if dataset_type == "boston_housing":
        print(f"{'Actual Price':<15}{'Predicted Price':<18}{'Accuracy %'}")
        print("-" * 50)
        for i in range(num_samples):
            actual = y_val[sample_indices[i]] * 1000  # Convert from $1000s to USD
            predicted = predictions[i][0] * 1000      # Convert predicted price to USD
            accuracy = 100 - ((abs(actual - predicted) / actual) * 100) if actual != 0 else 0
            print(f"${actual:,.2f}".ljust(15) + f"${predicted:,.2f}".ljust(18) + f"{accuracy:.2f}%")
    elif dataset_type == "titanic_survival":
        print(f"{'Actual':<10}{'Predicted %':<15}{'Predicted Class':<15}{'Correct %'}")
        print("-" * 50)
        for i in range(num_samples):
            actual = y_val[sample_indices[i]]
            predicted_prob = predictions[i][0]
            predicted_class = 1 if predicted_prob >= 0.5 else 0
            correctness = 100 if actual == predicted_class else 0
            print(f"{actual}".ljust(10) + f"{predicted_prob:.2%}".ljust(15) +
                  f"{predicted_class}".ljust(15) + f"{correctness}%")

def main():
    """
    Main function to run the neural network trainer.
    
    The function prompts the user for dataset selection, feature selection, and network configuration.
    It then loads and processes the data, builds and trains the model, evaluates its performance,
    and finally displays sample predictions.
    """
    print("\nNeural Network Trainer")
    
    dataset = select_dataset()
    
    if dataset == "boston_housing":
        df, features = select_features(dataset)
        if df is not None:
            X = df[features].values
            y = df["medv"].values  # House price in $1000s
            scaler = StandardScaler()
            X = scaler.fit_transform(X)
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
            output_size = 1
            output_activation = "linear"  # Regression task
    elif dataset == "titanic_survival":
        df, features = select_features(dataset)
        if df is not None:
            df.loc[:, "Age"] = df["Age"].fillna(df["Age"].mean()) # fill empty age data with the mean age
            X = df[features].values
            y = df["Survived"].values  # 0 = did not survive, 1 = survived
            scaler = StandardScaler()
            X = scaler.fit_transform(X)
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42) #
            output_size = 1
            output_activation = "sigmoid"  # Binary classification
    else:
        print("Error: Dataset selection failed.")
        return
    
    num_layers = get_user_input("Enter number of hidden layers:", input_type=int, min_val=1, max_val=5)
    layer_sizes = [get_user_input(f"Neurons in layer {i+1}:", input_type=int, min_val=4, max_val=64)
                   for i in range(num_layers)]
    
    model = build_model(input_dim=X_train.shape[1], hidden_layers=layer_sizes,
                        output_size=output_size, output_activation=output_activation)
    history = train_model(model, X_train, y_train, X_val, y_val, epochs=25)
    
    model.summary()
    plot_loss(history)
    evaluate_model(model, X_val, y_val, dataset)
    predict_samples(model, X_val, y_val, dataset)

if __name__ == "__main__":
    main()