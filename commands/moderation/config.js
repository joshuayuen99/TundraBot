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

        let setting;
        if (args[0]) setting = args[0].toLowerCase();
        else setting = args[0];

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
            case "logchannel": {
                let logChannel = await message.guild.channels.cache.find(channel => channel.name === settings.logChannel);

                if (!newSetting) {
                    return message.channel.send(`Current channel for logging: \`${settings.logChannel}\``);
                }

                let newLogChannelName;
                if (message.guild.channels.cache.some(channel => `<#${channel.id}>` === newSetting)) {
                    newLogChannelName = message.guild.channels.cache.find(channel => `<#${channel.id}>` === newSetting).name;
                } else if (await message.guild.channels.cache.some(channel => channel.name === newSetting)) {
                    newLogChannelName = newSetting;
                }

                if (!newLogChannelName) return message.channel.send("Sorry, I couldn't find that channel. Please try again and make sure you entered it correctly.");

                try {
                    await client.updateGuild(message.guild, {
                        logChannel: newLogChannelName
                    });

                    const updatedSettings = await client.getGuild(message.guild);

                    message.channel.send(`Log channel updated to: \`${updatedSettings.logChannel}\``);
                } catch (err) {
                    message.reply(`An error occurred: **${err.message}**`)
                    console.error(err);
                }
                break;
            }
            default:
                const editableSettings = ["prefix", "logChannel"];
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