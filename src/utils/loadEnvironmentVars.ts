export class UndefinedEnvironmentVariable extends Error {
    constructor(message: string) {
        super(`Environment variable ${message} must be defined.`);
        this.name = "UndefinedEnvironmentVariable";
    }
}

function getEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value == "") {
        throw new UndefinedEnvironmentVariable(name);
    }
    return value;
}

export const DATABASE_URL = getEnv("DATABASE_URL");
export const DATABASE_PORT = parseInt(getEnv("DATABASE_PORT"));
export const DATABASE_USER = getEnv("POSTGRES_USER");
export const DATABASE_PASSWORD = getEnv("POSTGRES_PASSWORD");
export const DATABASE_DB = getEnv("POSTGRES_DB");

export const BOT_ID = getEnv("BOT_ID");
export const BOT_SECRET = getEnv("BOT_SECRET");
export const DISCORD_TOKEN = getEnv("DISCORD_TOKEN");
export const SUPPORT_SERVER_ID = getEnv("SUPPORT_SERVER_ID");
