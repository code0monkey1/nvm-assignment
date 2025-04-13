/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, NextFunction } from 'express';
import { RegisterRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';

export class AuthController {
    constructor(
        private readonly userSerive: UserService,
        private readonly logger: Logger,
    ) {}

    register = async (
        req: RegisterRequest,
        res: Response,
        next: NextFunction,
    ): Promise<any> => {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return; // Ensure the function exits after sending the response
            }

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
