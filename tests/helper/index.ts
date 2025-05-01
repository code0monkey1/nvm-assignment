import { sign } from 'jsonwebtoken';
import { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Config } from '../../src/config';
import { AppDataSource } from '../../src/config/data-source';
import { ROLES } from '../../src/constants';
import { RefreshToken } from '../../src/entity/RefreshToken';
import { User } from '../../src/entity/User';
import { UserData } from '../../src/types';
import bcrypt from 'bcrypt';

export async function createUser(userData: UserData) {
    // store user
    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await userRepo.save({
        ...userData,
        role: ROLES.CUSTOMER,
        password: hashedPassword,
    });

    return user;
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

export async function getRefreshToken(user: User) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

    const presistedRefreshToken = await refreshTokenRepository.save({
        user, // typeorm will figure out how to save refrerence of user to refreshToken entry by creating a new column
        expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
    });

    return presistedRefreshToken;
}
export async function getSignedRefreshToken(persistedRefreshToken, user) {
    const refreshTokenSignUptions: SignOptions = {
        algorithm: 'HS256',
        expiresIn: '1y',
        issuer: 'auth-service',
        jwtid: String(persistedRefreshToken.id),
    };

    const payload: JwtPayload = {
        sub: String(user.id), // stores the userId of the user creating the token
        role: user.role,
    };

    const prev_refreshToken = sign(
        payload,
        Config.REFRESH_TOKEN_SECRET_KEY!,
        refreshTokenSignUptions,
    );

    return prev_refreshToken;
}
