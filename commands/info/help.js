const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "help",
    aliases: ["h"],
    category: "info",
    description: "Returns all commands, or one specific command info.",
    usage: "help [command | alias]",
    run: async (client, message, args) => {
        if (args[0]) {
            return getCommand(client, message, args[0]);
        } else {
            return getAll(client, message);
        }
    }
};

function getAll(client, message) {
    const embedMsg = new MessageEmbed()
        .setColor("RANDOM")
        .setDescription("**Commands**");

    // Get all the commands in a particular category
    const commands = category => {
        return client.commands
            .filter(cmd => cmd.category === category)
            .map(cmd => `- \`${cmd.name}\``)
            .join("\n");
    }
    /*
        const info = client.categories
            .map(cat => stripIndents`**${cat[0].toUpperCase() + cat.slice(1)}** \n${commands(cat)}`)
            .reduce((string, category) => string + "\n" + category);
    
        return message.channel.send(embedMsg.setDescription(info));
        */
    client.categories.forEach(category => {
        embedMsg.addField(stripIndents`**${category[0].toUpperCase() + category.slice(1)}**`, commands(category), true);
    });
    return message.channel.send(embedMsg);
}

function getCommand(client, message, input) {
    const embedMsg = new MessageEmbed()

    // Get the cmd from the commands list
    let cmd = client.commands.get(input.toLowerCase())
    if (!cmd) { // If the command wasn't found, check aliases
        cmd = client.commands.get(client.aliases.get(input.toLowerCase()));
    }
    if (!cmd) { // If the command still wasn't found
        let info = `No information found for command **${input.toLowerCase()}**`;
        return message.channel.send(embedMsg.setColor("RED").setDescription(info));
    }

    if (cmd.name) info = `**Command name**: \`${cmd.name}\``;    // Command name
    if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `\`${a}\``).join(", ")}`; // Aliases for the command
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;    // Description of the command
    if (cmd.usage) { // Shows the usage if it exists
        info += `\n**Usage**: ${cmd.usage}`;
        embedMsg.setFooter("Syntax: <> = required, [] = optional");
    }

    return message.channel.send(embedMsg.setColor("GREEN").setDescription(info));
}