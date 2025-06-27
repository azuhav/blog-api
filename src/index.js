import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { registrationValidator } from './validations/auth.js';
import { validationResult } from 'express-validator';

import User from './models/User.js';
import Post from './models/Post.js';

const app = express();
dotenv.config();

const port = process.env.PORT;
const db = process.env.MONGO_URL;

const admin = fs.readFileSync('/run/secrets/admin', 'utf8').trim();
const secret = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

app.use(express.json());

const corsOptions = {
    origin: "http://ui:3000",
    credentials: true,
};
app.use(cors(corsOptions));

app.use(cookieParser());

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
    }
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

app.post("/api/upload", authenticateToken, upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.status(201).json({ message: "Upload successful", imageUrl });
    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ message: "Upload failed", error });
    }
});

async function generatePasswordHash(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

function authenticateToken(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).send('Access Denied');

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(403).send('Invalid Token');
        req.user = user;
        next();
    });
}

async function main() {

    try {
        await mongoose.connect(db);
        console.log('DB connected');
    } catch (err) {
        console.error('DB connection failed', err);
    }
    app.listen(port, () => {
        console.log(`Backend server is listening on port ${port}`);
    });
}

main();

app.post('/api/register', registrationValidator, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        if (username !== admin) {
            console.error(`User ${username} is not ${admin}`);
            return res.status(400).json({ message: 'Can\'t register this user' });
        }

        const passwordHash = await generatePasswordHash(password);

        const doc = new User({ username, email, passwordHash });
        const user = await doc.save();

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ _id: user._id, email }, secret, { expiresIn: '1h' });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 1000
    });

    res.status(200).json({
        isAuthenticated: true,
        message: "Authentication Successful."
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('jwt').json({
        isAuthenticated: false,
        message: "Logout Successful."
    });
});

app.get('/api/auth-status', (req, res) => {
    const token = req.cookies?.jwt;

    if (!token) {
        return res.json({ isAuthenticated: false });
    }

    try {
        jwt.verify(token, secret);
        res.json({ isAuthenticated: true });
    } catch (error) {
        res.json({ isAuthenticated: false });
    }
});

app.get("/api/posts", async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5); // Sort by newest first
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

app.get("/api/posts/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
});


app.post('/api/posts/create', authenticateToken, async (req, res) => {
    try {
        const { title, text, tags, imageUrl } = req.body;
        const newPost = new Post({
            title,
            text,
            tags,
            imageUrl,
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { text, title, tags, imageUrl } = req.body;

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $set: { text, title, tags, imageUrl } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Failed to update post.', error: error.message });
    }
});

export default app;

