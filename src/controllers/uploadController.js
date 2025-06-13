export const handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.status(201).json({
            message: "Upload successful",
            imageUrl
        });
    } catch (error) {
        res.status(500).json({
            message: "Upload failed",
            error: error.message || "An unknown error occurred"
        });
    }
};
