import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app';
import {
    createUser,
    getRefreshToken,
    getSignedRefreshToken,
    isJwt,
} from '../helper';
import { JwtPayload, sign, SignOptions } from 'jsonwebtoken';
import { Config } from '../../src/config';
import { RefreshToken } from '../../src/entity/RefreshToken';
import jwt from 'jsonwebtoken';

describe('GET /auth/refresh', () => {
    const api = request(app);
    const BASE_URL = '/auth/refresh';

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

    describe('when all info present', () => {
        it('should return an accessToken and refreshToken inside a cookie', async () => {
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
            const response = await api
                .get(BASE_URL)
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

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            // check if it isJwt
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
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
            const response = await api
                .get(BASE_URL)
                .set('Cookie', [`refreshToken=${prev_refreshToken};`])
                .expect(200);

            // Check the Set-Cookie header in the response
            const cookies = (response.headers['set-cookie'] || []) as string[];

            expect(cookies).toBeDefined();

            // Verify that the cookies include HttpOnly flags
            let refreshToken = null as null | String;

            cookies.forEach((cookie) => {
                if (cookie.startsWith('refreshToken='))
                    refreshToken = cookie.split(';')[0].split('=')[1];
            });

            expect(refreshToken).not.toBeNull();

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

            expect(tokens).toHaveLength(1);
        });

        it('should create a new refreshToken record with user`s Id and token Id in the db', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: '12345678',
                email: 'email@gmail.com',
            };

            const user = await createUser(userData);

            const presistedRefreshToken = await getRefreshToken(user);

            const prevRefreshToken = await getSignedRefreshToken(
                presistedRefreshToken,
                user,
            );

            // save refreshToken to db
            const response = await api
                .get(BASE_URL)
                .set('Cookie', [`refreshToken=${prevRefreshToken};`])
                .expect(200);
            // extrach refreshToken
            // Check the Set-Cookie header in the response
            const cookies = (response.headers['set-cookie'] || []) as string[];

            expect(cookies).toBeDefined();

            // Verify that the cookies include HttpOnly flags
            let refToken = null as null | String;

            cookies.forEach((cookie) => {
                if (cookie.startsWith('refreshToken='))
                    refToken = cookie.split(';')[0].split('=')[1];
            });

            expect(refToken).not.toBeNull();

            const refTokenData = jwt.verify(
                refToken as string,
                Config.REFRESH_TOKEN_SECRET_KEY!,
            ) as JwtPayload;

            // prevTokenRecord id should not be there in the RefreshToken db
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

            const refreshToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number(refTokenData.jti),
                    user: {
                        id: Number(refTokenData.sub),
                    },
                },
            });

            expect(refreshToken).not.toBeNull();
        });
    });
});
