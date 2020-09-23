const { readdirSync } = require("fs");

const ascii = require("ascii-table");
const table = new ascii().setHeading("Event", "Load status");

module.exports = client => {
    readdirSync("./events/").forEach(file => {
        let pull = require(`../events/${file}`);

        let eventName = file.split(".")[0];

        if (eventName) { // Name of the event
            client.on(eventName, pull.bind(null, client));
            table.addRow(eventName, "\u2714");
        } else { // If there is no event name specified
            table.addRow(eventName, "\u2716");
            return;
        }
    });
    console.log(table.toString());
}