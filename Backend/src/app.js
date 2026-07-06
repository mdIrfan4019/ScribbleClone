import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Configure CORS
app.use(cors({
    origin: "*", // In a real production app we'd scope this, but for assignment we'll allow all origins
    methods: ["GET", "POST"],
    credentials: true
}));

// Request logger
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "ScribbleClone backend is healthy",
        timestamp: new Date().toISOString()
    });
});

// 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Backend Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error"
    });
});

export default app;
