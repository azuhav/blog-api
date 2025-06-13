import {
    showFirstFivePosts,
    getPostById,
    createPost,
    updatePost,
} from "../controllers/postController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const routes = (app) => {
    app.route('/api/posts').get(showFirstFivePosts);
    app.route('/api/posts/:id').get(getPostById).put(authenticateToken, updatePost);
    app.route('/api/posts/create').post(authenticateToken, createPost);
};

export default routes;
