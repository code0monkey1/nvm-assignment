import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import UserService from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import EncryptionService from '../services/EncriptionService';

const userRepository = AppDataSource.getRepository(User);
const encryptionSerivce = new EncryptionService();
const userService = new UserService(userRepository, encryptionSerivce);
const authController = new AuthController(userService, logger);

const route = Router();

route.post('/register', authController.register);

export default route;
