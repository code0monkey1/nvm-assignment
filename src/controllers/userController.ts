import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserData } from '../types';
import { validationResult } from 'express-validator';
import UserService from '../services/UserService';

export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return; // Ensure the function exits after sending the response
            }

            const userData = req.body as UserData;

            this.logger.info(
                `user data recieved at user creation endopint : ${JSON.stringify(userData, null, 2)}`,
            );

            const savedUser = await this.userService.create(userData);

            this.logger.info(
                `A new user with id:${savedUser.id} and role:${savedUser.role} has been created`,
            );

            res.status(201).json({ id: savedUser.id });
        } catch (e) {
            next(e);
        }
    };
}
