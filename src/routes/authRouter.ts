import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const authController = new AuthController();
const route = Router();

route.post('/register', authController.register);

export default route;
