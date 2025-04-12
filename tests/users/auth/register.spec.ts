import { AppDataSource } from './../../../src/config/data-source';
import request from 'supertest';
import app from '../../../src/app';
import { DataSource } from 'typeorm';
import { clearDb } from '../../utils';
import { User } from '../../../src/entity/User';

describe('POST /auth/register', () => {
    const api = request(app);
    const BASE_URL = '/auth/register';

    describe('when all data is present', () => {
        let connection: DataSource;

        beforeAll(async () => {
            connection = await AppDataSource.initialize();
        });

        beforeEach(async () => {
            // clear test db data
            await clearDb(connection);
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
                password: 'secret',
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
        it('should return 201 status', async () => {
            //arrange
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'unique_email@gmail.com',
                password: 'secret',
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
                password: 'secret',
            };

            // act
            // assert
            const response = await api.post(BASE_URL).send(userData);
            expect(response.headers['content-type']).toMatch(
                /application\/json/,
            );
        });
    });

    describe('when some data is missing', () => {});
});
