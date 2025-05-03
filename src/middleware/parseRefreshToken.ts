import { expressjwt as jwt } from 'express-jwt';
import { Config } from '../config';
import { Request } from 'express';
import { AuthCookie } from '../types';

// will parse the refresh token from cookies
export default jwt({
    secret: Config.REFRESH_TOKEN_SECRET_KEY!, // Use the refresh token secret key
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },
});
