 

import { NextFunction, Request, Response, Router } from 'express';
import authenticate from '../middleware/authenticate';

import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import { TenantData } from '../types';
import { ROLES } from '../constants';
import { canAccess } from '../middleware/canAccess';

const route = Router();

route.post(
    '/',
    authenticate,
    canAccess([ROLES.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // create tenant

            const tenantRepository = AppDataSource.getRepository(Tenant);

            const tenant = await tenantRepository.save(req.body as TenantData);

            res.status(201).json(tenant);
        } catch (e) {
            next(e);
        }
    },
);

export default route;
