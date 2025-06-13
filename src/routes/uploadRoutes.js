import { handleImageUpload } from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const uploadRoutes = (app, uploadMiddleware) => {
    app.post("/api/upload", authenticateToken, uploadMiddleware.single("image"), handleImageUpload);
};

export default uploadRoutes;
