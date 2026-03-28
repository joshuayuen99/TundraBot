import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
    DATABASE_DB,
    DATABASE_PASSWORD,
    DATABASE_PORT,
    DATABASE_URL,
    DATABASE_USER,
} from "../utils/loadEnvironmentVars.ts";

export const pool = new Pool({
    host: DATABASE_URL,
    port: DATABASE_PORT,
    database: DATABASE_DB,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
});

export const DB = drizzle({ client: pool, casing: "snake_case" });
