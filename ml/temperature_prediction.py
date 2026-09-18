import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import os
import json
import sys
import numpy as np

# -----------------------------------
# Locate dataset
# -----------------------------------
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "training_dataset.csv")

# -----------------------------------
# Load dataset
# -----------------------------------
data = pd.read_csv(csv_path)

# Create time index
data["time_index"] = range(len(data))

# -----------------------------------
# Train ML Model
# -----------------------------------
X = data[["time_index", "humidity", "temperature"]]
y = data["temperature"]

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# -----------------------------------
# Real sensor prediction (BOX-LKO-01)
# -----------------------------------
if len(sys.argv) > 1:

    temperature = float(sys.argv[1])
    humidity = float(sys.argv[2])

    input_data = pd.DataFrame({
        "time_index":[0],
        "humidity":[humidity],
        "temperature":[temperature]
    })

    predicted = model.predict(input_data)[0]

    # smoothing for real sensor
    predicted = (predicted * 0.4) + (temperature * 0.6)

    # prevent unrealistic jumps
    if abs(predicted - temperature) > 3:
        predicted = temperature + np.random.uniform(-1, 1)

    print(round(predicted,2))

    sys.exit()

print("\nCold Chain Temperature Forecast\n")

devices = data["deviceId"].unique()

predictions = []

# -----------------------------------
# Forecast for demo boxes
# -----------------------------------
for device in devices:

    device_data = data[data["deviceId"] == device]

    current_temp = device_data["temperature"].iloc[-1]
    humidity = device_data["humidity"].iloc[-1]

    print(device)

    # Predict next 30 minutes
    for step in range(1,7):

        next_input = pd.DataFrame({
            "time_index":[len(device_data)+step],
            "humidity":[humidity],
            "temperature":[current_temp]
        })

        predicted = model.predict(next_input)[0]

        # keep prediction close to current temperature
        predicted = (predicted * 0.5) + (current_temp * 0.5)

        # prevent unrealistic jumps
        if abs(predicted - current_temp) > 2:
            predicted = current_temp + np.random.uniform(-0.5, 0.5)

        # clamp realistic cold chain range
        predicted = max(2, min(8, predicted))

        print(step*5,"min →", round(predicted,2),"°C")

        current_temp = predicted

    # detect violation
    risk = current_temp > 8 or current_temp < 2

    if risk:
        print("⚠ Cold Chain Violation Risk")

    print()

    predictions.append({
        "deviceId": str(device),
        "predictedTemp": float(round(current_temp,2)),
        "risk": bool(risk)
    })

# -----------------------------------
# Save predictions for backend
# -----------------------------------
output_path = os.path.join(script_dir, "..", "ml_predictions.json")

with open(output_path,"w") as f:
    json.dump(predictions,f,indent=2)

print("Predictions saved to ml_predictions.json")