import { Request, Response, NextFunction } from 'express';
import { AuthRequest, LoginRequest, RegisterRequest } from '../types';
import UserService from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import TokenService from '../services/TokenService';
import createHttpError from 'http-errors';
import CredentialService from '../services/CredentialService';

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

            res.status(201).json({ id: savedUser.id });
        } catch (e) {
            next(e);
        }
    };

    login = async (req: LoginRequest, res: Response, next: NextFunction) => {
        try {
            // check if the given user info is valid
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return; // Ensure the function exits after sending the response
            }

            const { password, email } = req.body;

            // check the validity of username and password
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

            // return the auth token and refresh token
            const payload: JwtPayload = {
                sub: String(user.id), // stores the userId of the user creating the token
                role: user.role,
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
                await this.tokenService.persistRefreshToken(user);

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

            this.logger.info(`User with id:${user.id} logged in`);

            res.status(200).json({ id: user.id });
        } catch (e) {
            next(e);
        }
    };

    self = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;
            // take the userId from the token, and get the user details
            const userId = Number(authRequest.auth.sub);
            // attach the user details to the response object
            const user = await this.userSerive.findById(userId);

            res.json({
                ...user,
                password: undefined, // param `password` won't be even show up in the request body if declared undefined
            });
        } catch (e) {
            next(e);
        }
    };

    refresh = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;
            // take the userId from the token, and get the user details

            // delete previous refreshToken record from db
            await this.tokenService.deleteRefreshToken(
                Number(authRequest.auth.jti),
            );

            const userId = Number(authRequest.auth.sub);

            // attach the user details to the response object
            const user = await this.userSerive.findById(userId);

            // return the auth token and refresh token
            const payload: JwtPayload = {
                sub: authRequest.auth.sub, // stores the userId of the user creating the token
                role: authRequest.auth.role,
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
                await this.tokenService.persistRefreshToken(user);

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

            res.status(200).json({ id: user.id });
        } catch (e) {
            next(e);
        }
    };
}
