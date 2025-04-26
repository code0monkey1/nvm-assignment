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
export async function assertUserCreated(userData) {
    const userRepository = AppDataSource.getRepository(User);
    const savedUsers = await userRepository.find();
    expect(savedUsers).toHaveLength(1);
    expect(savedUsers[0]).toMatchObject({
        ...userData,
        password: expect.any(String),
    });
}

export async function assertHasErrorMessage(result, errMsg) {
    expect(result.body.errors.map((m) => m.msg)).toContain(errMsg);
    const userRepo = AppDataSource.getRepository(User);
}

export function isJwt(str) {
    // Basic JWT structure check (3 parts separated by dots)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

    // Verify string structure
    return jwtRegex.test(str);
}
