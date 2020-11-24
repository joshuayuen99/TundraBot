const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "help",
    aliases: ["h, commands"],
    category: "info",
    description: "Returns all commands, or detailed info about a specific command.",
    usage: "help [command | alias]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (args[0]) {
            return getCommand(client, message, args[0]);
        } else {
            return getAll(client, message, settings);
        }
    }
};

function getAll(client, message, settings) {
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
    client.categories.sort((a, b) => {
        const catgeoryOrder = ["info", "moderation", "music", "utility", "fun"];

        if (!catgeoryOrder.includes(a)) return 1;
        else if (!catgeoryOrder.includes(b)) return -1;

        return catgeoryOrder.indexOf(a) - catgeoryOrder.indexOf(b);
    });

    client.categories.forEach(category => {
        if (category != "ownerCommands") {
            embedMsg.addField(stripIndents`**${category[0].toUpperCase() + category.slice(1)}**`, commands(category), true);
        }
    });

    embedMsg.addField("Detailed usage", `Type \`${settings.prefix}help <command>\` to get detailed information about the given command.`);

    return message.channel.send(embedMsg);
}

function getCommand(client, message, input) {
    const embedMsg = new MessageEmbed()

    // Get the cmd from the commands list
    let cmd = client.commands.get(input.toLowerCase())
    if (!cmd) { // If the command wasn't found, check aliases
        cmd = client.commands.get(client.aliases.get(input.toLowerCase()));
    }
    if (!cmd || cmd.category === "ownerCommands") { // If the command still wasn't found
        let info = `No information found for command \`${input.toLowerCase()}\``;
        return message.channel.send(embedMsg.setColor("RED").setDescription(info));
    }

    let info;
    if (cmd.name) info = `**Command name**: \`${cmd.name}\``;    // Command name
    if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `\`${a}\``).join(", ")}`; // Aliases for the command
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;    // Description of the command
    if (cmd.usage) { // Shows the usage if it exists
        info += `\n**Usage**: ${cmd.usage}`;
        embedMsg.setFooter("Syntax: <> = required, [] = optional");
    }

    return message.channel.send(embedMsg.setColor("GREEN").setDescription(info));
}