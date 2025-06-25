import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { ROLES } from '../../src/constants';
import { createUser } from '../helper';
import { UserData } from '../../src/types';

describe('GET /users', () => {
    const api = request(app);
    const BASE_URL = '/users';

    let connection: DataSource;
    let jwksMock: ReturnType<typeof createJWKSMock>;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        jwksMock = createJWKSMock('http://localhost:3000');
    });

    beforeEach(async () => {
        jwksMock.start();
        // clear test db data , and then syncrhonize
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwksMock.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('authorized user', () => {
        it('should allow `admin` users to get all users', async () => {
            // get the token for the user
            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            const userData: UserData = {
                email: 'admin@gmail.com',
                password: 'adminpassword123',
                firstName: 'admin',
                lastName: 'admin',
            };

            await createUser(userData);

            const response = await api
                .get(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(200);

            expect(response.body[0].email).toBe(userData.email);
        });
    });

    describe('non-auth user', () => {
        it('should not allow user with no accessToken ', async () => {
            await api.get(BASE_URL).expect(401);
        });

        it('should not allow user with role `CUSTOMER` to view customers', async () => {
            // get the token for the user
            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.CUSTOMER,
            });

            const response = await api
                .get(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(403);

            expect(response.body.errors[0].msg).toBe(
                'User with role : customer not allowed to perfom operation!',
            );
        });
        it('should not allow user with role `MANAGER` to view customers', async () => {
            // get the token for the user
            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.MANAGER,
            });

            const response = await api
                .get(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(403);

            expect(response.body.errors[0].msg).toBe(
                'User with role : manager not allowed to perfom operation!',
            );
        });
    });
});
