import { Repository } from 'typeorm';
import { UserData } from '../types';
import { User } from '../entity/User';
class UserService {
    constructor(private userRepository: Repository<User>) {}

    create = async ({ firstName, lastName, email, password }: UserData) => {
        const savedUser = await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        });

        return savedUser;
    };
}

export default UserService;
