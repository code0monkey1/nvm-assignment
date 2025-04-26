import app from './app';
import { Config } from './config';
import { AppDataSource } from './config/data-source';
import logger from './config/logger';

const startServer = async () => {
    const PORT = Config.PORT;
    // initialize db connection
    await AppDataSource.initialize();
    logger.info('✅ Database connected successfully');
    try {
        app.listen(PORT, () => {
            logger.info(`✅ Server Running on`, { port: PORT });
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

void startServer();
