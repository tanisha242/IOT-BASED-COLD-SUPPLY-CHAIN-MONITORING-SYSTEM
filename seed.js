const mongoose = require("mongoose");
require("dotenv").config();
const SensorData = require("./models/SensorData");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Mongo connected");

  const devices = [
    { deviceId: "BOX-LKO-01", boxName: "Vaccine Freezer #1", location: "Lucknow" },
    { deviceId: "BOX-DEL-02", boxName: "Insulin Cold Box",   location: "Delhi"   },
    { deviceId: "BOX-JPR-03", boxName: "Flu Vax Crate",      location: "Jaipur"  },
  ];

  const now = Date.now();
  const points = [];
  devices.forEach((d, di) => {
    for (let i = 0; i < 200; i++) {
      const t = new Date(now - (200 - i) * 5 * 60 * 1000); // every 5 min
      const temp = 4 + Math.sin((i + di) / 10) * 2 + (Math.random() * 0.5);
      const hum  = 60 + Math.cos((i + di) / 12) * 5 + (Math.random() * 2);
      points.push({
        ...d,
        temperature: Number(temp.toFixed(1)),
        humidity: Number(hum.toFixed(1)),
        alert: temp > 8 || temp < 2,
        createdAt: t,
        updatedAt: t,
      });
    }
  });

  await SensorData.insertMany(points);
  console.log("Seeded", points.length, "rows");
  process.exit(0);
})();
