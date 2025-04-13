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
        try {
            const hashedPassword =
                await this.encryptionService.generateHash(password);

            const savedUser = await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
            });

            return savedUser;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            // create a custom error handler, to identify error happending
            throw createHttpError(500, 'Failed to store user data in DB ');
        }
    };
}

export default UserService;
