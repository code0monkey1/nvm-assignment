import express, { NextFunction, Request, Response } from 'express';
import createHttpError, { HttpError } from 'http-errors';
import logger from './config/logger';

const app = express();

app.get('/', (_req, res, next: NextFunction) => {
    try {
        const err = createHttpError(401, 'testing error');

        throw err;

        res.send('Hello');
    } catch (e) {
        next(e);
    }
});

// global error middleware defined at the end of all routes

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message);
    /**
     *  set up a uniform error statusCode setter
     * HttpError has a statusCode attribute, but some other sort of error might not, so we set 500 as default
     **/

    const statusCode = err.statusCode || 500;

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
