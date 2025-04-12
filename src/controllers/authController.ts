import { Response, NextFunction } from 'express';
import { RegisterUserRequest } from '../types';
import UserService from '../services/UserService';

class AuthController {
    constructor(private readonly userSerive: UserService) {}

    register = async (
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { firstName, lastName, password, email } = req.body;
            const savedUser = await this.userSerive.create({
                firstName,
                lastName,
                password,
                email,
            });
            res.status(201).json(savedUser);
        } catch (e) {
            next(e);
        }
    };
}

export default AuthController;
