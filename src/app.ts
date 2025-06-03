import 'reflect-metadata';
import express, { NextFunction, Request, Response, json } from 'express';
import { HttpError } from 'http-errors';
import logger from './config/logger';
import authRouter from './routes/authRouter';
import tenantRouter from './routes/tenantRouter';
import cookieParser from 'cookie-parser';
import path from 'path';
import userRouter from './routes/userRouter';
import cors from 'cors';
import { Config } from './config';

const app = express();

app.use(
    cors({
        origin: [Config.CLIENT_URL!],
        credentials: true, // ensures that only the request with credentials are allowed
    }),
);
app.use(
    express.static(path.join(__dirname, '../public'), {
        dotfiles: 'allow', // This allows serving files starting with a dot
    }),
);

app.get('/', (_req, res, next: NextFunction) => {
    try {
        res.send('Hello');
    } catch (e) {
        next(e);
    }
});

app.use(json());
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/tenants', tenantRouter);
app.use('/users', userRouter);

// global error middleware defined at the end of all routes

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message);
    /**
     *  set up a uniform error statusCode setter
     * HttpError has a statusCode attribute, but some other sort of error might not, so we set 500 as default
     **/

    const statusCode = err.statusCode || err.status || 500;

    // now create a uniform response type of an array of errors
    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '', // details about error [ url... etc . Filled in later ]
                location: '', // used to pin point exact line of error in codebase [ filled in later ]
            },
        ],
    });
});

export default app;
