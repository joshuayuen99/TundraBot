/*
Logger class for easy and aesthetically pleasing console logging
*/

import momentTimezone from "moment-timezone";

import { bgBlue, black, green } from "chalk";

function format(tDate: Date) {
    return momentTimezone(tDate).tz("America/New_York").format("YYYY-MM-DD HH:mm:ss:SSS");
}

type LogType = "info" | "warn" | "error" | "debug" | "cmd" | "ready";

export default class Logger {
    static log(type: LogType = "info", content: any): void {
        const date = `[${format(new Date(Date.now()))}]:`;
        switch (type) {
            // Check the message type and then print content in the console
            case "info": {
                return console.log(
                    `${date} ${bgBlue(type.toUpperCase())} ${content} `
                );
            }
            case "warn": {
                return console.log(
                    `${date} ${black.bgYellow(type.toUpperCase())} ${content} `
                );
            }
            case "error": {
                return console.error(
                    `${date} ${black.bgRed(type.toUpperCase())} ${content} `
                );
            }
            case "debug": {
                return console.log(
                    `${date} ${green(type.toUpperCase())} ${content} `
                );
            }
            case "cmd": {
                return console.log(
                    `${date} ${black.bgWhite(type.toUpperCase())} ${content}`
                );
            }
            case "ready": {
                return console.log(
                    `${date} ${black.bgGreen(type.toUpperCase())} ${content}`
                );
            }
            default:
                throw new TypeError(
                    "Logger type must be either warn, debug, info, ready, cmd or error."
                );
        }
    }
}
