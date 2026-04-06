import { defineConfig } from "drizzle-kit";

import {
    DATABASE_DB,
    DATABASE_PASSWORD,
    DATABASE_PORT,
    DATABASE_URL,
    DATABASE_USER,
} from "./src/utils/loadEnvironmentVars.ts";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema",
    out: "./drizzle",
    casing: "snake_case",
    dbCredentials: {
        host: DATABASE_URL,
        port: DATABASE_PORT,
        database: DATABASE_DB,
        user: DATABASE_USER,
        password: DATABASE_PASSWORD,
    },
});
