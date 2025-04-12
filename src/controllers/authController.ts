import { Request, Response, NextFunction } from 'express';
import { User } from '../entity/User';
import { AppDataSource } from '../config/data-source';

interface UserData {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
}

interface RegisterUserRequest extends Request {
    body: UserData;
}
export class AuthController {
    constructor() {}

    register = async (
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const { firstName, lastName, password, email } = req.body;

            const userRepository = AppDataSource.getRepository(User);

            const savedUser = await userRepository.save({
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
