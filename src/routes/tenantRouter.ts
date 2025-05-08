import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import { ROLES } from '../constants';
import { canAccess } from '../middleware/canAccess';
import { TenantController } from '../controllers/tenantController';
import logger from '../config/logger';
import tenantValidator from '../validators/tenant-validator';

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantController = new TenantController(tenantRepository, logger);

const route = Router();

route.post(
    '/',
    tenantValidator,
    authenticate,
    canAccess([ROLES.ADMIN]),
    tenantController.create,
);

export default route;
