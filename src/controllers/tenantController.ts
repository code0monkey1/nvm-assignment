import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import { Request, Response, NextFunction } from 'express';
import { TenantData } from '../types';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';

export class TenantController {
    constructor(
        private readonly tenantRepository: Repository<Tenant>,
        private readonly logger: Logger,
    ) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                res.status(400).json({ errors: result.array() });
                return; // Ensure the function exits after sending the response
            }

            const tenantData = req.body as TenantData;

            const tenant = await this.tenantRepository.save(tenantData);

            this.logger.info(`Tenant with id : ${tenant.id} created`);

            res.status(201).json({ id: tenant.id });
        } catch (e) {
            next(e);
        }
    };
}
