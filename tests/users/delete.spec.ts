import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { createJWKSMock } from 'mock-jwks';
import { ROLES } from '../../src/constants';
import { User } from '../../src/entity/User';
import { createUser } from '../helper';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('DELETE /users/:id', () => {
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

    describe('given all fields', () => {
        it('should return 200  status code', async () => {
            // get the token for the user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                role: ROLES.CUSTOMER,
                email: 'some@gmail.com',
                password: '12345678',
            };
            const user = await createUser(userData);

            const accessToken = jwksMock.token({
                sub: String(user.id),
                role: ROLES.CUSTOMER,
            });

            // create manager
            await api
                .delete(`${BASE_URL}/${user.id}`)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(204);
        });

        it('should delete user if the role in the access token is admin', async () => {
            // get the token for the user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                role: ROLES.CUSTOMER,
                email: 'some@gmail.com',
                password: '12345678',
            };
            const user = await createUser(userData);

            const accessToken = jwksMock.token({
                sub: '5',
                role: ROLES.ADMIN,
            });

            // delete user
            await api
                .delete(`${BASE_URL}/${user.id}`)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(204);
        });

        it('should cascade delete all associated refreshTokens when a user is deleted', async () => {
            // get the token for the user
            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                role: ROLES.CUSTOMER,
                email: 'some@gmail.com',
                password: '12345678',
            };

            const user = await createUser(userData);
            const user2 = await createUser({
                ...userData,
                email: 'other@gmail.com',
            });

            await saveRefreshTokenToDb(user);
            await saveRefreshTokenToDb(user2);

            // delete user
            await api
                .delete(`${BASE_URL}/${user.id}`)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(204);

            const refreshTokens = await getAllRefreshTokens();

            expect(refreshTokens).toHaveLength(1);

            expect(refreshTokens.map((r) => r.user.id)).not.toContain(user.id);
        });
    });

    describe('given not fields all fields', () => {
        it('should return 401 status code if userId is not the same as the user to delete', async () => {
            // get the token for the user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                role: ROLES.CUSTOMER,
                email: 'some@gmail.com',
                password: '12345678',
            };
            const user = await createUser(userData);

            const accessToken = jwksMock.token({
                sub: '28923842',
                role: ROLES.CUSTOMER,
            });

            // create manager
            await api
                .delete(`${BASE_URL}/${user.id}`)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(401);
        });
    });
});

async function saveRefreshTokenToDb(user: User) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

    await refreshTokenRepository.save({
        user, // typeorm will figure out how to save refrerence of user to refreshToken entry by creating a new column
        expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
    });
}

async function getAllRefreshTokens() {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const refreshTokens = await refreshTokenRepository.find({
        relations: {
            user: true,
        },
    });

    return refreshTokens;
}
