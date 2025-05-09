import { Request } from 'express';

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'customer' | 'admin' | 'manager';
    tenantId?: number;
}

export interface TenantData {
    address: string;
    name: string;
}

export interface RegisterRequest extends Request {
    body: UserData;
}

export interface LoginRequest extends Request {
    body: Pick<UserData, 'email' | 'password'>;
}
export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
        jti: string;
    };
}

export interface AuthCookie {
    accessToken: string;
    refreshToken: string;
}
