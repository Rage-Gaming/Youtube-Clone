import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import userroutes from "./routes/auth.js"
import videoroutes from "./routes/video.js"
import likeroutes from "./routes/like.js"
import watchlaterroutes from "./routes/watchlater.js"
import historyroutes from "./routes/history.js"
import commentroutes from "./routes/comment.js"
import path from "path"
import http from "http";
import { Server } from "socket.io"

dotenv.config()
const app = express()

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your Next.js frontend URL
        methods: ["GET", "POST"]
    }
});

app.use(cors())
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))

app.get("/", (req, res) => {
    res.send("Backend is working")
})

app.use(bodyParser.json())

app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyroutes);
app.use("/comment", commentroutes);
app.use("/uploads", express.static(path.join("uploads")));

console.clear();

io.on("connection", (socket) => {
    console.log(`User connected to signaling server: ${socket.id}`);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        socket.to(roomId).emit("user-connected", socket.id);
    });

    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (incoming) => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose.connect(DBURL).then(() => {
    console.log("Connected to the database")
}).catch((error) => {
    console.error("Error connecting to the database", error)
});