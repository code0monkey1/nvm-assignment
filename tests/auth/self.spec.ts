import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createTenant, createUser } from '../helper';
import { createJWKSMock } from 'mock-jwks';
import { ROLES } from '../../src/constants';
import { TenantData, UserData } from '../../src/types';
describe('GET auth/self', () => {
    let jwksMock: ReturnType<typeof createJWKSMock>;
    const api = request(app);
    const BASE_URL = '/auth/self';

    let connection: DataSource;

    beforeAll(async () => {
        jwksMock = createJWKSMock('http://localhost:3000');
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // start mock jwks server
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

    describe('when all fields are not present', () => {
        it('should return status code 401 when cookies are not supplied with request', async () => {
            await api.get(BASE_URL).expect(401);
        });
    });
    describe('When all fields are present', () => {
        it('should return status 200', async () => {
            //register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'email@gmail.com',
                password: '12345678',
                role: ROLES.CUSTOMER,
            };

            const user = await createUser(userData);

            const accessToken = jwksMock.token({
                sub: String(user.id),
                role: ROLES.CUSTOMER,
            });

            await api
                .get(BASE_URL)
                .set('Cookie', [`accessToken=${accessToken};`])
                .expect(200);
        });

        it('should return the user data', async () => {
            //register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'email@gmail.com',
                password: '12345678',
            };

            const user = await createUser(userData);

            // generate token (use Jwks mock to for jwks token verification)
            const accessToken = jwksMock.token({
                sub: String(user.id),
                role: user.role,
            });

            // add token to cookie
            const response = await api
                .get(BASE_URL)
                .expect(200)
                .set('Cookie', [`accessToken=${accessToken};`]);
            // check if userData matches with self body
            expect(response.body.id).toBe(user.id);
            expect(response.body.role).toBe(user.role);
        });

        it('should return tenant info of manager user', async () => {
            const tenantInfo: TenantData = {
                address: 'tenant_address',
                name: 'tenant_name',
            };
            const tenant = await createTenant(tenantInfo);

            const managerInfo: UserData = {
                email: 'manager@gmail.com',
                firstName: 'manager_first_name',
                lastName: 'manager_last_name',
                password: 'manager123456',
                role: 'manager',
                tenantId: tenant.id,
            };

            const manager = await createUser(managerInfo);

            const accessToken = jwksMock.token({
                sub: String(manager.id),
                role: ROLES.MANAGER,
            });

            // add token to cookie
            const response = await api
                .get(BASE_URL)
                .expect(200)
                .set('Cookie', [`accessToken=${accessToken};`]);

            // check if tenantInfo is retrieved
            expect(response.body.tenant.name).toBe(tenantInfo.name);
            expect(response.body.tenant.address).toBe(tenantInfo.address);
        });

        it('should not return the password field', async () => {
            //register a user
            const userData = {
                firstName: 'first_name',
                lastName: 'last_name',
                email: 'email@gmail.com',
                password: '12345678',
            };

            const user = await createUser(userData);

            // generate token (use Jwks mock to for jwks token verification)
            const accessToken = jwksMock.token({
                sub: String(user.id),
                role: user.role,
            });

            // add token to cookie
            const response = await api
                .get(BASE_URL)
                .expect(200)
                .set('Cookie', [`accessToken=${accessToken};`]);

            // check if userData matches with self body
            expect(response.body.password).toBeUndefined();
        });
    });
});
