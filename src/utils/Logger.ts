import PinoLogger from "pino";

const logLevel = process.env["LOG_LEVEL"] || "info";

export const Logger = PinoLogger({
    level: logLevel,
});
