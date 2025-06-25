import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { AppDataSource } from '../config/data-source';
import { ROLES } from '../constants';
import { canAccess } from '../middleware/canAccess';
import logger from '../config/logger';
import { User } from '../entity/User';
import { UserController } from '../controllers/userController';
import userValidator from '../validators/user-validator';
import UserService from '../services/UserService';
import EncryptionService from '../services/EncriptionService';

const userRepository = AppDataSource.getRepository(User);
const encryptionSerivce = new EncryptionService();
const userService = new UserService(userRepository, encryptionSerivce);
const userController = new UserController(userService, logger);

const route = Router();

route.post(
    '/',
    userValidator,
    authenticate,
    canAccess([ROLES.ADMIN]),
    userController.create,
);

route.delete('/:id', authenticate, userController.delete);

route.get('/', authenticate, canAccess([ROLES.ADMIN]), userController.getAll);

export default route;
