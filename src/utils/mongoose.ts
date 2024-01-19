import mongoose from "mongoose";
import Logger from "./logger";

export function init (): void {
    const dbOptions = {
        useNewUrlParser: true,
        autoIndex: false,
        poolSize: 5,
        connectTimeoutMS: 10000,
        family: 4,
        useUnifiedTopology: true
    } as mongoose.ConnectOptions;

    const connectionString = `${process.env.MONGOOSE_PROTOCOL}://${process.env.MONGOOSE_USERNAME}:${process.env.MONGOOSE_PASSWORD}@${process.env.MONGOOSE_URL}/${process.env.MONGOOSE_DB}?retryWrites=true&w=majority`;
    Logger.log("debug", `Mongoose connection string: ${connectionString}`);
    mongoose.connect(connectionString, dbOptions);
    mongoose.set("useFindAndModify", false);

    mongoose.connection.on("connected", () => {
        Logger.log("ready", "Mongoose connection successfully opened!");
    });

    mongoose.connection.on("err", (err) => {
        Logger.log("error", `Mongoose connection error: \n${err.stack}`);
    });

    mongoose.connection.on("disconnected", () => {
        Logger.log("info", "Mongoose connection disconnected.");
    });
}