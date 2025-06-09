import bcrypt from 'bcryptjs';
import { Config } from '../config';
import { AppDataSource } from '../config/data-source';
import { ROLES } from '../constants';
import { User } from '../entity/User';
import logger from '../config/logger';

export const createAdmin = async () => {
    // create a new admin user on startup if it does not alreay exist
    const userRepo = AppDataSource.getRepository(User);

    const adminUser = await userRepo.findOne({
        where: { email: Config.ADMIN_EMAIL },
    });

    if (adminUser) {
        return;
    }

    await userRepo.save({
        email: Config.ADMIN_EMAIL!,
        password: await bcrypt.hash(Config.ADMIN_PASSWORD!, 10),
        role: ROLES.ADMIN,
        firstName: 'admin',
        lastName: 'admin',
    });

    logger.info(' ✅ New Admin User Created');
};
