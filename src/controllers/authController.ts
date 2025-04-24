/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, NextFunction } from 'express';
import { RegisterRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import TokenService from '../services/TokenService';

export class AuthController {
    constructor(
        private readonly userSerive: UserService,
        private readonly tokenService: TokenService,
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

            const payload: JwtPayload = {
                sub: String(savedUser.id), // stores the userId of the user creating the token
                role: savedUser.role,
            };
            // create accessToken
            const accessToken = this.tokenService.generateAccessToken(payload);

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true, // very important to prevent access to any client side code
            });

            // create refreshToken
            const persistedRefreshToken =
                await this.tokenService.persistRefreshToken(savedUser);

            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(persistedRefreshToken.id),
            );

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true, // very important to prevent access to any client side code
            });

            this.logger.info(`User has been created with id:${savedUser.id}`);

            res.status(201).json(savedUser);
        } catch (e) {
            next(e);
        }
    };
}
