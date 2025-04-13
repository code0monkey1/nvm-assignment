import { AppDataSource } from '../../src/config/data-source';
import { ROLES } from '../../src/constants';
import { User } from '../../src/entity/User';
import { UserData } from '../../src/types';
import bcrypt from 'bcrypt';

export async function createUser(userData: UserData) {
    // store user
    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await userRepo.save({
        ...userData,
        role: ROLES.CUSTOMER,
        password: hashedPassword,
    });
}
