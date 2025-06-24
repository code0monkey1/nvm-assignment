import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { AuthRequest, UserData } from '../types';
import { validationResult } from 'express-validator';
import UserService from '../services/UserService';
import createHttpError from 'http-errors';
import { ROLES } from '../constants';

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

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.userService.findAll();

            res.json(users);
        } catch (e) {
            next(e);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authId = (req as AuthRequest).auth.sub;
            const authRole = (req as AuthRequest).auth.role;

            if (!(req.params.id == authId || authRole == ROLES.ADMIN)) {
                throw createHttpError(
                    401,
                    `User not allowed to perform this operation`,
                );
            }

            await this.userService.deleteById(Number(req.params.id));

            res.status(204).end();
        } catch (e) {
            next(e);
        }
    };
}
