import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app';
import { assertHasErrorMessage, createUser, isJwt } from '../helper';

describe('POST auth/login', () => {
    const api = request(app);
    const BASE_URL = '/auth/login';

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

            // create the user
            await createUser(userData);

            const response = await api
                .post(BASE_URL)
                .send(userData)
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
    });

    describe('when all info is not present', () => {
        describe('invalid user data', () => {
            it('should throw error when user is not registered', async () => {
                const userData = {
                    email: 'email@gmail.com',
                    password: '12345678',
                };

                const result = await api
                    .post(BASE_URL)
                    .send(userData)
                    .expect(400);

                await assertHasErrorMessage(
                    result,
                    'Email or Password is Invalid',
                );
            });

            it('should throw error when user password does not match', async () => {
                // first create a user

                const userData = {
                    email: 'email@gmail.com',
                    password: '12345678',
                    firstName: 'first_name',
                    lastName: 'last_name',
                };

                await createUser(userData);

                const result = await api
                    .post(BASE_URL)
                    .send({ ...userData, password: '12345679' })
                    .expect(400);

                await assertHasErrorMessage(
                    result,
                    'Email or Password is Invalid',
                );
            });
        });
        describe('validation errors', () => {
            it('should throw validation error if email id is invalid', async () => {
                const userData = {
                    email: 'some_invalid_mail',
                    password: '12345678',
                };

                const result = await api
                    .post(BASE_URL)
                    .send(userData)
                    .expect(400);

                await assertHasErrorMessage(result, 'Email should be valid');
            });

            it('should throw validation error if password is missing', async () => {
                const userData = {
                    email: 'email@gmail.com',
                };

                const result = await api
                    .post(BASE_URL)
                    .send(userData)
                    .expect(400);

                await assertHasErrorMessage(result, 'password is missing');
            });
        });
    });
});
