import app from './app';

import { Config } from './config';
import logger from './config/logger';

const startServer = () => {
    const PORT = Config.PORT;

    try {
        app.listen(PORT, () => {
            logger.info(`✅ Server Running on`, { port: PORT });
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

startServer();
