const mongoose = require("mongoose");

module.exports = {
    init: () => {
        const dbOptions = {
            useNewUrlParser: true,
            autoIndex: false,
            poolSize: 5,
            connectTimeoutMS: 10000,
            family: 4,
            useUnifiedTopology: true
        };

        mongoose.connect(`mongodb+srv://${process.env.MONGOOSE_USERNAME}:${process.env.MONGOOSE_PASSWORD}@${process.env.MONGOOSE_URL}/${process.env.MONGOOSE_DB}?retryWrites=true&w=majority`, dbOptions);
        mongoose.set("useFindAndModify", false);
        mongoose.Promise = global.Promise;

        mongoose.connection.on("connected", () => {
            console.log("Mongoose connection successfully opened!");
        });

        mongoose.connection.on("err", (err) => {
            console.error(`Mongoose connection error: \n${err.stack}`);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("Mongoose connection disconnected.");
        });
    }
}