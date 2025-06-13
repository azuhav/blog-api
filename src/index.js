import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT;
const db = process.env.MONGO_URL;

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: "http://ui:3000",
    credentials: true
};
app.use(cors(corsOptions));

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${path.basename(file.originalname)}`)
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

postRoutes(app);
userRoutes(app);
uploadRoutes(app, upload);

async function main() {
    try {
        await mongoose.connect(db);
        console.log('✅ DB connected');
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
    }

    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
}

main();

export default app;
