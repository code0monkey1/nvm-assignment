import { Request, Response, NextFunction } from 'express';
import { AuthRequest, LoginRequest, RegisterRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import TokenService from '../services/TokenService';
import createHttpError from 'http-errors';
import CredentialService from '../services/CredentialService';
import { ROLES } from '../constants';

export class AuthController {
    constructor(
        private readonly userSerive: UserService,
        private readonly tokenService: TokenService,
        private readonly credentialService: CredentialService,
        private readonly logger: Logger,
    ) {}

    register = async (
        req: RegisterRequest,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return; // Ensure the function exits after sending the response
            }

            const { firstName, lastName, password, email, tenantId } = req.body;

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
                tenantId,
                role: ROLES.CUSTOMER,
            });

            const payload: JwtPayload = {
                sub: String(savedUser.id),
                role: savedUser.role,
            };

            await this.tokenService.setTokens(res, savedUser, payload);

            this.logger.info(`User has been created with id:${savedUser.id}`);

            res.status(201).json({ id: savedUser.id });
        } catch (e) {
            next(e);
        }
    };

    login = async (req: LoginRequest, res: Response, next: NextFunction) => {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return;
            }

            const { password, email } = req.body;

            const user = await this.userSerive.findByEmail(email);

            if (!user) {
                throw createHttpError(400, 'Email or Password is Invalid');
            }

            const isCorrectPassword =
                await this.credentialService.isCorrectPassword(
                    password,
                    user.password,
                );

            if (!isCorrectPassword) {
                throw createHttpError(400, 'Email or Password is Invalid');
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            await this.tokenService.setTokens(res, user, payload);

            this.logger.info(`User with id:${user.id} logged in`);

            res.status(200).json({ id: user.id });
        } catch (e) {
            next(e);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;

            await this.tokenService.deleteRefreshToken(
                Number(authRequest.auth.jti),
            );

            this.logger.info(`User with id:${authRequest.auth.sub} logged out`);

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.end();
        } catch (e) {
            next(e);
        }
    };

    self = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;
            const userId = Number(authRequest.auth.sub);
            const user = await this.userSerive.findById(userId);

            res.json({
                ...user,
                password: undefined,
            });
        } catch (e) {
            next(e);
        }
    };

    refresh = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;

            await this.tokenService.deleteRefreshToken(
                Number(authRequest.auth.jti),
            );

            const userId = Number(authRequest.auth.sub);
            const user = await this.userSerive.findById(userId);

            const payload: JwtPayload = {
                sub: authRequest.auth.sub,
                role: authRequest.auth.role,
            };

            await this.tokenService.setTokens(res, user, payload);

            res.status(200).json({ id: user.id });
        } catch (e) {
            next(e);
        }
    };
}
