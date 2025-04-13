import { AppDataSource } from './../../../src/config/data-source';
import request from 'supertest';
import app from '../../../src/app';
import { DataSource } from 'typeorm';
import { User } from '../../../src/entity/User';
import { ROLES } from '../../../src/constants';
import { createUser } from '../../helper';

describe('POST /auth/register', () => {
    const api = request(app);
    const BASE_URL = '/auth/register';

    describe('when all data is present', () => {
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
            const userRepository = connection.getRepository(User);
            const savedUsers = await userRepository.find();

            expect(savedUsers).toHaveLength(1);

            expect(savedUsers[0]).toMatchObject({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: expect.any(String), // or use specific encryption validation
            });
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
            await api.post(BASE_URL).send(userData).expect(201);
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
    });
});
