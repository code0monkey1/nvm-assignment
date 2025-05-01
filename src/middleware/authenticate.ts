import { expressjwt as jwt } from 'express-jwt';
import { Config } from '../config';
import jwksClient from 'jwks-rsa';
import { Request } from 'express';
import { AuthCookie } from '../types';
// will parse the jwks and cookies
export default jwt({
    secret: jwksClient.expressJwtSecret({
        jwksUri: Config.JWKS_URI!, // the url that hosts the public rsa key, used for decoding the authToken `jwt` sighed using RS256
        cache: true, // so that the end point does not have to always retrieve the public rsa key for ever request
        rateLimit: true, // to limit the number of requests by all services to the endpoint
    }),
    algorithms: ['RS256'],
    getToken(req: Request) {
        const authHeader = req.headers.authorization;

        if (
            authHeader &&
            authHeader.split(' ')[0] == 'Bearer' &&
            authHeader.split(' ')[1]
        ) {
            const accessToken = authHeader.split(' ')[1];
            return accessToken;
        }

        const { accessToken } = req.cookies as AuthCookie;

        return accessToken;
    },
});
