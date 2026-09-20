import express from "express";
import cors from "cors";
import router from "./routers/todoRouter.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv'
const app = express();
dotenv.config()
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:1234",
    credentials: true,
  }),
);
app.use(express.json())
// connect to db
try {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("db connected!! "))
    .catch((err) => console.error("db connection failed!! ", err));
} catch (error) {
  console.error("connection to db failure, ", error);
}

//   routes

app.use('/api', router);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server running on:", port));



