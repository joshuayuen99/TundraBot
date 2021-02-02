const { MessageEmbed } = require("discord.js");
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
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (!message.member.hasPermission("MANAGE_GUILD")) {
            return message.reply("Sorry but you don't have the permissions to change the configs. You must have the `Manage Server` permission.");
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
                let logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                if (!newSetting) {
                    if (!settings.logMessages.enabled || !logChannel) { // disabled
                        message.channel.send(`Current channel for logging: \`None\`.`);
                    } else {
                        message.channel.send(`Current channel for logging: ${logChannel}`);
                    }
                    return;
                }

                let newLogChannel;
                if (message.guild.channels.cache.some(channel => `<#${channel.id}>` === newSetting)) {
                    newLogChannel = message.guild.channels.cache.find(channel => `<#${channel.id}>` === newSetting);
                } else if (message.guild.channels.cache.some(channel => channel.name === newSetting && channel.type == "text")) {
                    newLogChannel = message.guild.channels.cache.find(channel => channel.name === newSetting);
                }

                if (!newLogChannel) return message.channel.send("Sorry, I couldn't find that channel. Please try again and make sure you entered it correctly.");

                try {
                    await client.updateGuild(message.guild, {
                        logMessages: {
                            enabled: true,
                            channelID: newLogChannel.id
                        }
                    });

                    const updatedSettings = await client.getGuild(message.guild);

                    message.channel.send(`Log channel updated to: <#${updatedSettings.logMessages.channelID}>`);
                } catch (err) {
                    message.reply(`An error occurred: **${err.message}**`)
                    console.error(err);
                }
                break;
            }
            case "soundboardrole": {
                if (!newSetting) {
                    return message.channel.send(`Current role for using most soundboard commands: <@&${settings.soundboardRoleID}>`);
                }

                let newRole;
                if (message.guild.roles.cache.some(role => role.name === newSetting)) {
                    newRole = message.guild.roles.cache.find(role => role.name === newSetting);
                } else if (message.guild.roles.cache.some(role => role.toString() === newSetting)) {
                    newRole = message.guild.roles.cache.find(role => role.toString() === newSetting);
                }

                if (!newRole) {
                    message.channel.send("Sorry, I couldn't find that role. Please try again and make sure you entered it correctly.");

                    return;
                }

                try {
                    await client.updateGuild(message.guild, {
                        soundboardRoleID: newRole.id
                    });

                    message.channel.send(`Soundboard role updated to: ${newRole}`);
                } catch (err) {
                    message.reply(`An error occurred: **${err.message}**`)
                    console.error(err);
                }
                break;
            }
            default:
                let settingsString = "";
                // prefix
                settingsString += `**prefix**: \`${settings["prefix"]}\`\n`;
                
                // logChannel
                let logChannel = message.guild.channels.cache.get(settings["logMessages"]["channelID"]);
                settingsString += `**logChannel**: ${logChannel}\n`;

                //soundboardRole
                let soundboardRole = message.guild.roles.cache.get(settings["soundboardRoleID"]);
                settingsString += `**soundboardRole**: ${soundboardRole}\n`;

                settingsString += `\nFor additional configuration visit my [web dashboard](${process.env.DASHBOARD_URL}) and log in to see this server!`;

                const embedMsg = new MessageEmbed()
                    .setColor("PURPLE")
                    .setTitle("Configuration Settings")
                    .setDescription(settingsString);

                message.channel.send(embedMsg).catch((err) => {
                    console.error("Error displaying current config: ", err);
                    message.channel.send("Error displaying current config.");
                });
                break;
        }
    }
};