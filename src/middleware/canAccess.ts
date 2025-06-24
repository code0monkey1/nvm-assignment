import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types';
import createHttpError from 'http-errors';

export const canAccess = (roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const authRequest = req as AuthRequest;
            const userRole = authRequest.auth.role;

            if (!roles.includes(userRole)) {
                throw createHttpError(
                    403,
                    `User with role : ${userRole} not allowed to perfom operation!`,
                );
            }

            next();
        } catch (e) {
            next(e);
        }
    };
};
