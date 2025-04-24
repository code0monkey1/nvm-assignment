import { Router } from 'express';
import UserService from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import EncryptionService from '../services/EncriptionService';
import registerValidator from '../validators/register-validator';
import { AuthController } from '../controllers/authController';
import TokenService from '../services/TokenService';
import { RefreshToken } from '../entity/RefreshToken';

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const encryptionSerivce = new EncryptionService();
const userService = new UserService(userRepository, encryptionSerivce);
const tokenService = new TokenService(refreshTokenRepository);
const authController = new AuthController(userService, tokenService, logger);

const route = Router();
route.post('/register', registerValidator, authController.register);

export default route;
