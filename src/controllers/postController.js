import Post from '../models/Post.js';

export const showFirstFivePosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch posts",
            error: error.message || "An unknown error occurred",
        });
    }
};

export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch a post",
            error: error.message || "An unknown error occurred",
        });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, text, tags, imageUrl } = req.body;
        const newPost = new Post({ title, text, tags, imageUrl });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { text, title, tags, imageUrl } = req.body;
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $set: { text, title, tags, imageUrl } },
            { new: true }
        );
        if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update post', error: error.message });
    }
};
