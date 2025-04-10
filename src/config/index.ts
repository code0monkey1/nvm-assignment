/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { config } from "dotenv";

config()

const {PORT,NODE_ENV} = process.env 

export const Config= {
    PORT,
    NODE_ENV
}