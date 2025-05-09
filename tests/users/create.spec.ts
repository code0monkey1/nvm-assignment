import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { createJWKSMock } from 'mock-jwks';
import { ROLES } from '../../src/constants';
import { User } from '../../src/entity/User';
import { assertHasErrorMessage, getAllUsers } from '../helper';
import { Tenant } from '../../src/entity/Tenant';
import { TenantData } from '../../src/types';

describe('POST /users', () => {
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
        it('should return 201 created status code', async () => {
            // get the token for the user
            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            // create a tenant =
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_address',
            };

            const tenant = await createTenant(tenantData);

            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: '12345678',
                email: 'email@gmail.com',
                role: ROLES.ADMIN,
                tenantId: tenant.id,
            };

            // create manager

            await api
                .post(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .send(userData)
                .expect(201);
        });

        it('should create a new user in the database', async () => {
            // get the token for the user
            const ADMIN_TOKEN = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            // create a tenant =
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_address',
            };

            const tenant = await createTenant(tenantData);

            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: '12345678',
                email: 'email@gmail.com',
                tenantId: tenant.id,
                role: ROLES.MANAGER,
            };

            // create manager

            const response = await api
                .post(BASE_URL)
                .set('Cookie', [`accessToken=${ADMIN_TOKEN};`])
                .send(userData);

            const createdUserId = response.body.id;

            const userRepository = AppDataSource.getRepository(User);
            const users = await userRepository.find({});

            expect(users).toHaveLength(1);
            expect(users[0].id).toBe(createdUserId);
        });

        it('should create a new user with role `manager` in the database', async () => {
            // get the token for the user
            const ADMIN_TOKEN = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            // create a tenant =
            const tenantData = {
                name: 'tenant_name',
                address: 'tenant_address',
            };

            const tenant = await createTenant(tenantData);

            // first register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: '12345678',
                email: 'email@gmail.com',
                tenantId: tenant.id,
                role: ROLES.MANAGER,
            };

            // create manager

            const response = await api
                .post(BASE_URL)
                .set('Cookie', [`accessToken=${ADMIN_TOKEN};`])
                .send(userData)
                .expect(201);

            const createdUserId = response.body.id;

            const users = await getAllUsers();

            expect(users).toHaveLength(1);
            expect(users[0].id).toBe(createdUserId);
            expect(users[0].role).toBe(ROLES.MANAGER);
        });
    });

    describe('If not given all fields correctly', () => {
        it('should return 401 when no auth token is provided', async () => {
            await api.post(BASE_URL).expect(401);
        });

        it('should return 403 if non-admin user tries to create a user', async () => {
            // get the token for the user

            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.CUSTOMER,
            });

            await api
                .post(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(403);
        });
    });

    describe('validation errors', () => {
        it('should return 400 status with expected validation error if tenantId is missing ', async () => {
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                password: '12345678',
                email: 'email@gmail.com',
            };

            const accessToken = jwksMock.token({
                sub: `1`,
                role: ROLES.ADMIN,
            });

            const result = await api
                .post(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .send(userData)
                .expect(400);

            await assertHasErrorMessage(result, 'tenantId is missing');
        });
    });
});

async function createTenant(tenantData: TenantData) {
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.save(tenantData);
    return tenant;
}
