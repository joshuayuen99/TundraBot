const { stripIndents } = require("common-tags");

module.exports = {
    name: "config",
    aliases: ["configs"],
    category: "moderation",
    description: stripIndents`Allows members with the \`Manage Server\` permission to edit the config for the bot.

    No arguments will display all the current settings.
    config <setting> will display the current value of that particular setting.
    config <setting> <new value> will change the value of that particular setting.`,
    usage: "config [setting] [new value]",
    run: async (client, message, args, settings) => {
        if (!message.member.hasPermission("MANAGE_GUILD")) {
            return message.reply("Sorry but you don't have the permissions to change the configs. You must have the \`Manage Server\` permission.");
        }

        const setting = args[0];
        const newSetting = args.slice(1).join(" ");

        switch (setting) {
            case "prefix": {
                if (!newSetting) {
                    return message.channel.send(`Current prefix: \`${settings.prefix}\``);
                }
                try {
                    await client.updateGuild(message.guild, {
                        prefix: newSetting
                    });

                    const updatedSettings = await client.getGuild(message.guild);

                    message.channel.send(`Prefix updated to: \`${updatedSettings.prefix}\``);
                } catch (err) {
                    message.reply(`An error occurred: **${err.message}**`)
                    console.error(err);
                }

                break;
            }
            default:
                const editableSettings = ["prefix"];
                let settingsString = "";
                for (let setting in settings) {
                    if (!editableSettings.includes(setting)) continue;
                    settingsString += `**${setting}**: \`${settings[setting]}\`\n`;
                }

                message.channel.send(settingsString).catch((err) => {
                    message.channel.send("Error displaying current config.");
                });
                break;
        }
    }
};