import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app';
import { RefreshToken } from '../../src/entity/RefreshToken';
import { createUser } from '../helper';
import { Config } from '../../src/config';
import { JwtPayload, sign, SignOptions } from 'jsonwebtoken';

describe('POST /auth/logout', () => {
    const api = request(app);
    const BASE_URL = '/auth/logout';

    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // clear test db data , and then syncrhonize
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    it('should delete the previous refreshToken record from the db', async () => {
        // first register a user
        const userData = {
            firstName: 'first_name',
            lastName: 'last_name',
            password: '12345678',
            email: 'email@gmail.com',
        };
        const user = await createUser(userData);

        // create refresh
        // create refreshToken
        const refreshTokenRepository =
            AppDataSource.getRepository(RefreshToken);

        const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

        const presistedRefreshToken = await refreshTokenRepository.save({
            user, // typeorm will figure out how to save refrerence of user to refreshToken entry by creating a new column
            expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
        });

        const refreshTokenSignUptions: SignOptions = {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(presistedRefreshToken.id),
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

        // save refreshToken to db
        await api
            .post(BASE_URL)
            .set('Cookie', [`refreshToken=${prev_refreshToken};`])
            .expect(200);

        // prevTokenRecord id should not be there in the RefreshToken db
        const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

        const prevTokenRecord = await refreshTokenRepo.findOne({
            where: {
                id: presistedRefreshToken.id,
                user: {
                    id: user.id,
                },
            },
        });

        expect(prevTokenRecord).toBeNull();

        const tokens = await refreshTokenRepo.find({});

        expect(tokens).toHaveLength(0);
    });

    it('should should not have refreshToken and accessToken attached to the response cookie', async () => {
        // first register a user
        const userData = {
            firstName: 'first_name',
            lastName: 'last_name',
            password: '12345678',
            email: 'email@gmail.com',
        };
        const user = await createUser(userData);

        // create refreshToken
        const refreshTokenRepository =
            AppDataSource.getRepository(RefreshToken);

        const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

        const presistedRefreshToken = await refreshTokenRepository.save({
            user, // typeorm will figure out how to save refrerence of user to refreshToken entry by creating a new column
            expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
        });

        const refreshTokenSignUptions: SignOptions = {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(presistedRefreshToken.id),
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

        // save refreshToken to db
        const response = await api
            .post(BASE_URL)
            .set('Cookie', [`refreshToken=${prev_refreshToken};`])
            .expect(200);

        // Check the Set-Cookie header in the response
        const cookies = (response.headers['set-cookie'] || []) as string[];

        expect(cookies).toBeDefined();

        // Verify that the cookies include HttpOnly flags
        let accessToken = null as null | String;
        let refreshToken = null as null | String;

        cookies.forEach((cookie) => {
            if (cookie.startsWith('accessToken=')) {
                accessToken = cookie.split(';')[0].split('=')[1];
            }
            if (cookie.startsWith('refreshToken=')) {
                refreshToken = cookie.split(';')[0].split('=')[1];
            }
        });

        // should set the accessToken and refreshToken to blank values
        expect(accessToken).toBe('');
        expect(refreshToken).toBe('');
    });
});
