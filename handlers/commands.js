const { readdirSync } = require("fs");

const ascii = require("ascii-table");
const table = new ascii().setHeading("Command", "Load status");

module.exports = client => {
    readdirSync("./commands/").forEach(dir => {
        // Gets all .js "commands"
        const commands = readdirSync(`./commands/${dir}`).filter(f => f.endsWith(".js"));

        // For every .js "command"
        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);

            if (pull.name) { // Name of the command
                client.commands.set(pull.name, pull);
                table.addRow(pull.name, "\u2714");
            } else {    // If there is no command name specified
                table.addRow(pull.name, "\u2716");
                continue;
            }

            // If there are any aliases for the command
            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        }
    });
    console.log(table.toString());
}