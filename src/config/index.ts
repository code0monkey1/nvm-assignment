import { config } from 'dotenv';
import path from 'path';

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || 'dev'}`),
});

const {
    PORT,
    NODE_ENV,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    PRIVATE_KEY,
    REFRESH_TOKEN_SECRET_KEY,
    JWKS_URI,
} = process.env;

export const Config = {
    PORT,
    NODE_ENV,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    PRIVATE_KEY,
    REFRESH_TOKEN_SECRET_KEY,
    JWKS_URI,
};
