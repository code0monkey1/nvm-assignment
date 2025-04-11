import { Request, Response, NextFunction } from 'express';

export class AuthController {
    constructor() {}

    register = (req: Request, res: Response, next: NextFunction) => {
        try {
            res.status(201).json();
        } catch (e) {
            next(e);
        }
    };
}
