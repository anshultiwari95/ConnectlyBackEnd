import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auths.js";
import userRoutes from "./routes/users.js";
import cors from "cors";

const app = express();

dotenv.config();

const connect = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log("Connected to Database!!");
    })
    .catch((err) => {
      console.error("Error connecting to database:!", err);
      process.exit(1); // Exit process if DB connection fails
    });
};

app.use(cookieParser());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://connectly-front-end.vercel.app", // Use environment variable for production
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use("/api/auths", authRoutes);
app.use("/api/users", userRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

// Start server after DB connection
app.listen(8800, () => {
  connect();
  console.log("Server is running on http://localhost:8800");
});
