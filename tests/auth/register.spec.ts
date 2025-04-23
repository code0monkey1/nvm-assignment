import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import { ROLES } from '../../src/constants';
import {
    assertHasErrorMessage,
    assertUserCreated,
    createUser,
    isJwt,
} from '../helper';

describe('POST /auth/register', () => {
    const api = request(app);
    const BASE_URL = '/auth/register';

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

    describe('when all data is present', () => {
        it('should persist registered users data in database', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfade',
            };

            // act
            await api.post(BASE_URL).send(userData);

            // assert
            await assertUserCreated(userData);
        });

        it('should create id for saved user', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfad',
            };

            // act
            await api.post(BASE_URL).send(userData);

            // assert
            const userRepository = connection.getRepository(User);
            const savedUsers = await userRepository.find();
            expect(savedUsers).toHaveLength(1);

            expect(savedUsers[0]).toHaveProperty('id');
        });
        it('should return 201 status', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfad',
            };

            // act
            // assert
            const result = await api.post(BASE_URL).send(userData);
        });

        it('should return valid JSON response', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfad',
            };

            // act
            // assert
            const response = await api.post(BASE_URL).send(userData);
            expect(response.headers['content-type']).toMatch(
                /application\/json/,
            );
        });
        it('should have the `role` as `customer` after registration', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfad',
            };

            // act
            await api.post(BASE_URL).send(userData);

            // assert
            const userRepository = connection.getRepository(User);
            const savedUsers = await userRepository.find();

            expect(savedUsers).toHaveLength(1);

            expect(savedUsers[0]).toHaveProperty('role');
            expect(savedUsers[0].role).toBe(ROLES.CUSTOMER);
        });
        it('should not have the saved password as the original password ', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secretfad',
            };

            // act
            await api.post(BASE_URL).send(userData);

            // assert
            const userRepository = connection.getRepository(User);
            const savedUsers = await userRepository.find();

            expect(savedUsers).toHaveLength(1);

            expect(savedUsers[0].password).not.toBe(userData.password);
            expect(savedUsers[0].password).toHaveLength(60);

            // regex match to check if it's a valid hashed password
            expect(savedUsers[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it('should return status 400 if email aready exists', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: 'secret',
                email: 'email@gmail.com',
            };

            await createUser(userData);
            await api.post(BASE_URL).send(userData).expect(400);

            // ensure no new user has been created
            const userRepository = connection.getRepository(User);
            const savedUsers = await userRepository.find();
            expect(savedUsers).toHaveLength(1);
        });
        it('should return status 400 if email is empty', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: 'secret',
                email: '',
            };

            await api.post(BASE_URL).send(userData).expect(400);
        });

        describe('token based auth', () => {
            it('should return an accessToken and refreshToken inside a cookie', async () => {
                // first register a user
                const userData = {
                    firstName: 'first_name',
                    lastName: 'last_name',
                    password: '12345678',
                    email: 'email@gmail.com',
                };

                const response = await api
                    .post(BASE_URL)
                    .send(userData)
                    .expect(201);

                // Check the Set-Cookie header in the response
                const cookies = (response.headers['set-cookie'] ||
                    []) as string[];

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
            });
        });
    });

    describe('Fields are not in proper format', () => {
        it('removes spaces from email', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: 'secreteight',
                email: ' some_mail@gmail.com ',
            };

            await api.post(BASE_URL).send(userData).expect(201);

            // ensure no new user has been created with trimmed email
            await assertUserCreated({
                ...userData,
                email: 'some_mail@gmail.com',
            });
        });

        it('should return status 400 if the firstName is an empty string', async () => {
            // first register a user
            const userData = {
                firstName: ' ',
                lastName: 'last_name',
                password: 'secreteight',
                email: ' some_mail@gmail.com ',
            };

            await api.post(BASE_URL).send(userData).expect(400);

            const userRepo = connection.getRepository(User);
            const storedUsers = await userRepo.find();
            expect(storedUsers).toHaveLength(0);
        });

        it('should return status 400 if the password is missing', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: ' some_mail@gmail.com ',
            };

            await api.post(BASE_URL).send(userData).expect(400);

            const userRepo = connection.getRepository(User);
            const storedUsers = await userRepo.find();
            expect(storedUsers).toHaveLength(0);
        });

        it('should return status 400 if the lastName is missing', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: ' ',
                email: ' some_mail@gmail.com ',
            };

            await api.post(BASE_URL).send(userData).expect(400);

            const userRepo = connection.getRepository(User);
            const storedUsers = await userRepo.find();
            expect(storedUsers).toHaveLength(0);
        });

        it('should return status 400 if the email is not valid', async () => {
            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: ' some_mail ',
                passwrod: 'my_password_eight',
            };

            const result = await api.post(BASE_URL).send(userData).expect(400);

            await assertHasErrorMessage(result, 'Email should be valid');
        });

        it('should return appropriate message when password is less than 8 chars', async () => {
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'some_mail@gmail.com',
                password: '1234567',
            };

            const result = await api.post(BASE_URL).send(userData).expect(400);

            await assertHasErrorMessage(
                result,
                'Password must be at least 8 characters long',
            );
        });
    });
});
