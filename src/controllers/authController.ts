/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, NextFunction } from 'express';
import { RegisterRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload, sign, SignOptions } from 'jsonwebtoken';
import { Config } from '../config';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entity/RefreshToken';

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

            const payload: JwtPayload = {
                sub: String(savedUser.id), // stores the userId of the user creating the token
                role: savedUser.role,
            };

            // create accessToken
            const accessTokenSignOptions: SignOptions = {
                algorithm: 'RS256',
                expiresIn: '1h', // 1 hour,
                issuer: 'auth-service',
            };

            const accessToken = sign(
                payload,
                Config.PRIVATE_KEY!,
                accessTokenSignOptions,
            );

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true, // very important to prevent access to any client side code
            });

            // create refreshToken

            //save refreshToken to db
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

            const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

            const savedRefreshToken = await refreshTokenRepo.save({
                user: savedUser,
                expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
            });

            const refreshTokenSignUptions: SignOptions = {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
                jwtid: String(savedRefreshToken.id),
            };

            const refreshToken = sign(
                payload,
                Config.REFRESH_TOKEN_SECRET_KEY!,
                refreshTokenSignUptions,
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
