import mongoose from "mongoose";
/*global process, a*/
/*eslint no-undef: "error"*/
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import app from "./app.js";

const mongo = process.env.MONGO_URL;
mongoose
  .connect(mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to mongo");
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log("server started");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
