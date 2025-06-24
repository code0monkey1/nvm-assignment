import { Repository } from 'typeorm';
import { UserData } from '../types';
import { User } from '../entity/User';
import createHttpError from 'http-errors';
import EncryptionService from './EncriptionService';
class UserService {
    // we get the userRepositry type from TypeOrm ( we can injext AppDataSource.getRepository<User> into it)
    constructor(
        private userRepository: Repository<User>,
        private encryptionService: EncryptionService,
    ) {}
    findById = async (id: number) => {
        const user = await this.userRepository.findOne({
            where: {
                id,
            },
            relations: {
                tenant: true,
            },
        });

        if (!user) {
            throw createHttpError(400, 'User Does Not Exist');
        }

        return user;
    };
    create = async ({
        firstName,
        lastName,
        email,
        password,
        tenantId,
        role,
    }: UserData) => {
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
            role,
            tenant: tenantId ? { id: tenantId } : undefined, // this needs a tenantObject to be passed in OR undefined
        });

        return savedUser;
    };

    findByEmail = async (email: string) => {
        return await this.userRepository.findOneBy({ email });
    };

    deleteById = async (id: number) => {
        await this.userRepository.delete(id);
    };

    findAll = async () => {
        return await this.userRepository.find({});
    };
}

export default UserService;
