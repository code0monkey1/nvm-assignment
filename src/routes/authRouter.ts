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
import loginValidator from '../validators/login-validator';
import CredentialService from '../services/CredentialService';

import authenticate from '../middleware/authenticate';

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const encryptionSerivce = new EncryptionService();
const userService = new UserService(userRepository, encryptionSerivce);
const tokenService = new TokenService(refreshTokenRepository);
const credentialService = new CredentialService();
const authController = new AuthController(
    userService,
    tokenService,
    credentialService,
    logger,
);

const route = Router();

route.post('/register', registerValidator, authController.register);

route.post('/login', loginValidator, authController.login);

route.get('/self', authenticate, authController.self);

export default route;
