import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import UserService from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const authController = new AuthController(userService);
const route = Router();

route.post('/register', authController.register);

export default route;
