import { expressjwt as jwt } from 'express-jwt';
import { Config } from '../config';
import { Request } from 'express';
import { AuthCookie } from '../types';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entity/RefreshToken';
import { JwtPayload } from 'jsonwebtoken';
import logger from '../config/logger';

// will parse the refresh token from cookies
export default jwt({
    secret: Config.REFRESH_TOKEN_SECRET_KEY!, // Use the refresh token secret key
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },
    async isRevoked(_req: Request, token) {
        try {
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

            const payload = token!.payload as JwtPayload;

            const savedToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number(payload.jti),
                    user: {
                        id: Number(payload.sub),
                    },
                },
            });

            return savedToken === null;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            logger.error('Error while retrieveing refresh token', {
                id: (token?.payload as JwtPayload).jti,
            });
        }
        return true;
    },
});
