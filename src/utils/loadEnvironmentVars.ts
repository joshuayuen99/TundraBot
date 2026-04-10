export class UndefinedEnvironmentVariable extends Error {
    constructor(message: string) {
        super(`Environment variable ${message} must be defined.`);
        this.name = "UndefinedEnvironmentVariable";
    }
}

export function getEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value == "") {
        throw new UndefinedEnvironmentVariable(name);
    }
    return value;
}

export const Env = {
    DATABASE_URL: "DATABASE_URL",
    DATABASE_PORT: "DATABASE_PORT",
    DATABASE_USER: "POSTGRES_USER",
    DATABASE_PASSWORD: "POSTGRES_PASSWORD",
    DATABASE_DB: "POSTGRES_DB",

    BOT_ID: "BOT_ID",
    BOT_SECRET: "BOT_SECRET",
    DISCORD_TOKEN: "DISCORD_TOKEN",
    SUPPORT_SERVER_ID: "SUPPORT_SERVER_ID",
} as const;
