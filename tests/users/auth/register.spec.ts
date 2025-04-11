import request from 'supertest';
import app from '../../../src/app';

describe('POST /auth/register', () => {
    const api = request(app);
    const BASE_URL = '/auth/register';

    describe('when all data is present', () => {
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
