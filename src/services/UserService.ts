import { Repository } from 'typeorm';
import { UserData } from '../types';
import { User } from '../entity/User';
import createHttpError from 'http-errors';
import { ROLES } from '../constants';
import EncryptionService from './EncriptionService';

class UserService {
    // we get the userRepositry type from TypeOrm ( we can injext AppDataSource.getRepository<User> into it)
    constructor(
        private userRepository: Repository<User>,
        private encryptionService: EncryptionService,
    ) {}

    create = async ({ firstName, lastName, email, password }: UserData) => {
        const hashedPassword =
            await this.encryptionService.generateHash(password);

        // check if user with emailId already exists
        const userExists = await this.userRepository.findOne({
            where: { email },
        });

        if (userExists) {
            throw createHttpError(
                400,
                'Email Already Registered, Login Instead!',
            );
        }

        const savedUser = await this.userRepository.save({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: ROLES.CUSTOMER,
        });

        return savedUser;
    };

    findByEmail = async (email: string) => {
        return await this.userRepository.findOneBy({ email });
    };
}

export default UserService;
