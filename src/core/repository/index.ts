import mongoose from "mongoose";

const CONNECTION_URI = process.env.DB_URI || null;

export let isConnected = false;

export function initialize() {
  connect();
  mongoose.Promise = global.Promise;
}

function connect() {
  if (!CONNECTION_URI) {
    console.log("invalid mongoose uri", CONNECTION_URI);
    return;
  }

    mongoose.connect(CONNECTION_URI).catch((error) => {
    console.log("mongoose error", error);
  });
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;

  const date = new Date().toLocaleString();
  console.log("mongoose disconnected", date);
});

mongoose.connection.on("connected", () => {
  isConnected = true;

  const date = new Date().toLocaleString();
  console.log("mongoose connected", date);
});
