import { sign } from 'jsonwebtoken';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Config } from '../config';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entity/RefreshToken';
import { User } from '../entity/User';
import { Response } from 'express';

class TokenService {
    constructor(
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    generateAccessToken = (payload: JwtPayload) => {
        // create accessToken
        const accessTokenSignOptions: SignOptions = {
            algorithm: 'RS256',
            expiresIn: '1h', // 1 hour,
            issuer: 'auth-service',
        };

        const accessToken = sign(
            payload,
            Config.PRIVATE_KEY!,
            accessTokenSignOptions,
        );

        return accessToken;
    };

    persistRefreshToken = async (user: User) => {
        const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

        const savedRefreshToken = await this.refreshTokenRepository.save({
            user, // typeorm will figure out how to save refrerence of user to refreshToken entry by creating a new column
            expiresAt: new Date(Date.now() + ONE_YEAR), // 1 year later from data of creation
        });

        return savedRefreshToken;
    };

    generateRefreshToken = (
        payload: JwtPayload,
        persistedRefreshTokenId: string,
    ) => {
        const refreshTokenSignUptions: SignOptions = {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: persistedRefreshTokenId,
        };

        const refreshToken = sign(
            payload,
            Config.REFRESH_TOKEN_SECRET_KEY!,
            refreshTokenSignUptions,
        );

        return refreshToken;
    };

    deleteRefreshToken = async (id: number) => {
        return await this.refreshTokenRepository.delete({ id });
    };

    setTokens = async (res: Response, user: User, payload: JwtPayload) => {
        // Generate and set access token
        const accessToken = this.generateAccessToken(payload);
        res.cookie('accessToken', accessToken, {
            domain: 'localhost',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true,
        });

        // Generate and set refresh token
        const persistedRefreshToken = await this.persistRefreshToken(user);

        const refreshToken = this.generateRefreshToken(
            payload,
            String(persistedRefreshToken.id),
        );
        res.cookie('refreshToken', refreshToken, {
            domain: 'localhost',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
            httpOnly: true,
        });
    };
}

export default TokenService;
