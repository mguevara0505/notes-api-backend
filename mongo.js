const mongoose = require("mongoose");

const connectionString = process.env.MONGO_DB_URI;

// conexión a mongodb
mongoose
  .connect(connectionString, {})
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error(err);
  });

process.on("uncaughtException", () => {
  mongoose.connection.disconnect();
});
