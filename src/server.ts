import app from './app';
import { Config } from './config';
import { AppDataSource } from './config/data-source';
import logger from './config/logger';

const startServer = async () => {
    try {
        const PORT = Config.PORT;

        // initialize db connection
        await AppDataSource.initialize();

        logger.info('✅ Database connected successfully');
        app.listen(PORT, () => {
            logger.info(`✅ Server Running on`, { port: PORT });
        });
    } catch (e) {
        logger.error(e);
        process.exit(1);
    }
};

void startServer();
