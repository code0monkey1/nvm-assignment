import { Response, NextFunction } from 'express';
import { RegisterUserRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';

class AuthController {
    constructor(
        private readonly userSerive: UserService,
        private readonly logger: Logger,
    ) {}

    register = async (
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { firstName, lastName, password, email } = req.body;

            this.logger.debug('User Info', {
                firstName,
                lastName,
                email,
                password: '***',
            });

            const savedUser = await this.userSerive.create({
                firstName,
                lastName,
                password,
                email,
            });

            this.logger.info(`User has been created with id:${savedUser.id}`);

            res.status(201).json(savedUser);
        } catch (e) {
            next(e);
        }
    };
}

export default AuthController;
