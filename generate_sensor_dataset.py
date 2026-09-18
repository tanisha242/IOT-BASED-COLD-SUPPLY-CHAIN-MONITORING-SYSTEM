import random
import csv
from datetime import datetime, timedelta

# Demo boxes only (exclude real box)
device_ids = [
"BOX-DEL-02",
"BOX-MUM-03",
"BOX-BLR-04",
"BOX-HYD-05",
"BOX-PUNE-06"
]

rows = []

start_time = datetime(2025, 1, 1)

for device in device_ids:

    # realistic base temperature
    temp = random.uniform(4, 6)

    for i in range(1000):   # 1000 readings per box

        temp += random.uniform(-0.3, 0.3)

        humidity = random.uniform(40, 60)

        rows.append([
            device,
            round(temp,2),
            round(humidity,2),
            (start_time + timedelta(minutes=10*i)).strftime("%Y-%m-%d %H:%M:%S")
        ])

with open("synthetic_sensor_data.csv", "w", newline="") as f:

    writer = csv.writer(f)

    writer.writerow([
        "deviceId",
        "temperature",
        "humidity",
        "createdAt"
    ])

    writer.writerows(rows)

print("Dataset generated successfully")