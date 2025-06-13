import {
    registerUser,
    loginUser,
    logoutUser,
    checkAuthStatus
} from "../controllers/userController.js";

import { registrationValidator } from "../validations/auth.js";

const userRoutes = (app) => {
    app.route('/api/register').post(registrationValidator, registerUser);
    app.route('/api/login').post(loginUser);
    app.route('/api/logout').post(logoutUser);
    app.route('/api/auth-status').get(checkAuthStatus);
};

export default userRoutes;
