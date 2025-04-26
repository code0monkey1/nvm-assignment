import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { Config } from '.';
import { RefreshToken } from '../entity/RefreshToken';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    // do not let this be true in prod , else it'll override all stored data ( only to be `true` in dev/test)
    synchronize: Config.NODE_ENV === 'dev',
    logging: false,
    entities: [User, RefreshToken], // register every newly created entity here
    migrations: [],
    subscribers: [],
});
