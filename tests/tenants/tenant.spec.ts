import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { createJWKSMock } from 'mock-jwks';
import { ROLES } from '../../src/constants';
import { Tenant } from '../../src/entity/Tenant';
import { TenantData } from '../../src/types';
import { assertHasErrorMessage } from '../helper';

describe('POST /tenants', () => {
    const api = request(app);
    const BASE_URL = '/tenants';

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

    describe('POST /tenants ', () => {
        describe('If all info correct', () => {
            it('should return 201 created status code', async () => {
                // get the token for the user
                const accessToken = jwksMock.token({
                    sub: `1`,
                    role: ROLES.ADMIN,
                });

                const tenantData: TenantData = {
                    name: 'tenant_1',
                    address: 'tenant_address',
                };

                await api
                    .post(BASE_URL)
                    .set('Cookie', [`accessToken=${accessToken};`])
                    .send(tenantData)
                    .expect(201);
            });

            it('should create a new tenant in the DB', async () => {
                // get the token for the user
                const accessToken = jwksMock.token({
                    sub: `1`,
                    role: ROLES.ADMIN,
                });

                const tenantData: TenantData = {
                    name: 'tenant_1',
                    address: 'tenant_address',
                };

                await api
                    .post(BASE_URL)
                    .send(tenantData)
                    .set('Cookie', [`accessToken=${accessToken};`])
                    .expect(201);

                // expect tenant to be created

                const tenantRepository = AppDataSource.getRepository(Tenant);

                const tenants = await tenantRepository.find({});

                expect(tenants).toHaveLength(1);

                expect(tenants[0].name).toBe(tenantData.name);
            });
        });

        describe('If all info not correct', () => {
            it('should return 401 status without an auth token', async () => {
                // get the token for the user
                await api.post(BASE_URL).expect(401);
            });
            it('should return 401 for non-admin roles trying to create tenant', async () => {
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
            it('should throw validation error if email id is invalid', async () => {
                const userData = {
                    address: '12345678',
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

                await assertHasErrorMessage(result, 'tenant name is missing');
            });
        });
    });
});
