import { Router } from 'express';
import UserService from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import EncryptionService from '../services/EncriptionService';
import registerValidator from '../validators/register-validator';
import { AuthController } from '../controllers/authController';

const userRepository = AppDataSource.getRepository(User);
const encryptionSerivce = new EncryptionService();
const userService = new UserService(userRepository, encryptionSerivce);
const authController = new AuthController(userService, logger);

const route = Router();
route.post('/register', registerValidator, authController.register);

export default route;
