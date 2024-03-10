import mongoose from "mongoose";

export let isConnected = false;

export function initialize() {
  mongoose
    .connect(process.env.DB_URI || "")
    .then(() => {
      isConnected = true;
      console.log("mongoose connected");
    })
    .catch((error) => {
      console.log("mongoose error", error);
    });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.log("mongoose disconnected");
  });

  mongoose.Promise = global.Promise;
}
