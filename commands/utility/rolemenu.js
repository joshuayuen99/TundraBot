const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage, waitResponse } = require("../../functions.js");
const RoleMenu = require("../../models/RoleMenu.js");

module.exports = {
    name: "rolemenu",
    aliases: ["rm"],
    category: "utility",
    description: "Starts an interactive wizard to create a rolemenu. Using the update flag allows you to update a pre-existing role menu by providing the message ID. Delete or remove will delete a role menu.",
    usage: "rolemenu [update/edit `messageID`] [delete/remove `messageID`]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        // No permissions
        if (!message.member.hasPermission("MANAGE_ROLES")) {
            await message.channel.send("Sorry, you don't have the `MANAGE_ROLES` permission.");

            return;
        }

        if (!args[0]) createRoleMenu(client, message, args, settings);
        else if (args.includes("update") || args.includes("edit")) {
            updateRoleMenu(client, message, args, settings);
        } else if (args.includes("delete") || args.includes("remove")) {
            removeRoleMenu(client, message, args, settings);
        } else {
            createRoleMenu(client, message, args, settings)
        }
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").MessageReaction} reaction Discord MessageReaction
     * @param {import("discord.js").User} user Discord User
    */
    roleMenuHandleMessageReactionAdd: (client, reaction, user) => {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not a role menu
        if (!client.databaseCache.roleMenus.has(reaction.message.id)) return;

        let cachedRoleMenu = client.databaseCache.roleMenus.get(reaction.message.id);
        for (let option of cachedRoleMenu.roleOptions) {
            if (option.emoji == reaction.emoji.toString()) {
                let member = reaction.message.guild.members.cache.get(user.id);
                if (!member.roles.cache.has(option.roleID)) { // give member the role
                    member.roles.add(option.roleID);
                }

                break;
            }
        }
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").MessageReaction} reaction Discord MessageReaction
     * @param {import("discord.js").User} user Discord User
    */
    roleMenuHandleMessageReactionRemove: (client, reaction, user) => {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not a role menu
        if (!client.databaseCache.roleMenus.has(reaction.message.id)) return;

        let cachedRoleMenu = client.databaseCache.roleMenus.get(reaction.message.id);
        for (let option of cachedRoleMenu.roleOptions) {
            if (option.emoji == reaction.emoji.toString()) {
                reaction.message.guild.members.fetch(user.id);
                let member = reaction.message.guild.members.cache.get(user.id);
                if (!member) { // member left the server and reactions were automatically removed
                    break;
                }

                if (member.roles.cache.has(option.roleID)) { // remove the role
                    member.roles.remove(option.roleID);
                }

                break;
            }
        }
    }
};

async function createRoleMenu(client, message, args, settings) {
    await message.channel.send("What channel should I put the rolemenu in? eg. #general (type `here` for the current one)");
    let postChannelMessage = await waitResponse(client, message, message.author, 120);
    if (!postChannelMessage) {
        return message.reply("Cancelling rolemenu.");
    }

    let postChannelName;
    if (postChannelMessage.content.toLowerCase() === "here") {
        postChannelName = message.channel.name;
    }
    else if (message.guild.channels.cache.some(channel => `<#${channel.id}>` === postChannelMessage.content)) {
        postChannelName = message.guild.channels.cache.find(channel => `<#${channel.id}>` === postChannelMessage.content).name;
    } else {
        postChannelName = postChannelMessage.content;
    }

    let postChannel;
    // Check to see if the channel exists
    if (message.guild.channels.cache.some(channel => channel.name === postChannelName && channel.type == "text")) {
        postChannel = message.guild.channels.cache.find(channel => channel.name === postChannelName);

        // Check to make sure we have permission to post in the channel
        const botPermissionsIn = message.guild.me.permissionsIn(postChannel);
        if (!botPermissionsIn.has("SEND_MESSAGES")) return await message.reply("I don't have permission to post in that channel. Contact your server admin to give me permission overrides.");
    } else { // Channel doesn't exist
        return await message.reply("I couldn't find that channel! Cancelling rolemenu.");
    }

    await message.channel.send(stripIndents`Using channel ${postChannel}
        What should I title the rolemenu?`);
    let menuTitleMessage = await waitResponse(client, message, message.author, 120);
    if (!menuTitleMessage) {
        return await message.reply("Cancelling rolemenu.");
    }

    const roleMenuEmbed = new MessageEmbed()
        .setColor("PURPLE")
        .setTitle(menuTitleMessage.content)
        .setFooter("React with one of the above emojis to receive the specified role!");

    const roleMenuMessage = await postChannel.send(roleMenuEmbed);

    message.channel.send("Rolemenu started! It will be updated as you go.");

    let roleMenuString = "";

    let roleOptions = [];

    let isDone = false;
    while (!isDone) {
        let retry = false;
        const emojiQueryEmbed = new MessageEmbed()
            .setTitle("Create Role Menu")
            .setDescription("What's the emoji to use? Type `done` to finish.")
            .setColor("YELLOW");

        let queryMessage = await message.channel.send(emojiQueryEmbed);
        let responseEmojiMessage = await waitResponse(client, message, message.author, 5 * 60);
        if (!responseEmojiMessage) {
            queryMessage.delete();
            message.reply("Cancelling rolemenu.");
            isDone = true;
            continue;
        } else if (responseEmojiMessage.content.toLowerCase() == "done") {
            await queryMessage.delete();
            await responseEmojiMessage.delete();
            await roleMenuMessage.edit(roleMenuEmbed
                .setDescription(roleMenuString)
                .setColor("BLUE"));
            await message.reply(`Rolemenu finished! Check ${postChannel} to see it.`);

            const roleMenuObject = {
                messageID: roleMenuMessage.id,
                guildID: roleMenuMessage.guild.id,
                channelID: roleMenuMessage.channel.id,
                roleMenuTitle: menuTitleMessage.content,
                roleOptions: roleOptions
            };

            await client.createRoleMenu(roleMenuObject);

            await client.databaseCache.roleMenus.set(roleMenuObject.messageID, roleMenuObject);

            isDone = true;
            continue;
        }

        for (let option of roleOptions) {
            if (option.emoji === responseEmojiMessage.content) {
                message.channel.send("That emoji is already being used!");
                retry = true;
                break;
            }
        }
        if (retry) continue;

        await roleMenuMessage.react(responseEmojiMessage.content)
            .catch((err) => {
                message.channel.send("I had trouble reacting with that emoji...");
                console.error("roleMenu react error: ", err);
                retry = true;
            });
        if (retry) continue;

        roleMenuString += `${responseEmojiMessage.content}: \`none\``;
        roleMenuEmbed.setDescription(roleMenuString);
        roleMenuMessage.edit(roleMenuEmbed);

        queryMessage.delete();
        let responseEmoji = responseEmojiMessage.content;
        responseEmojiMessage.delete();

        let roleFound = false;
        while (!roleFound) {
            const roleQueryEmbed = new MessageEmbed()
                .setTitle("Create Role Menu")
                .setDescription(`What role should ${responseEmoji} assign? eg. @everyone`)
                .setColor("YELLOW");

            queryMessage = await message.channel.send(roleQueryEmbed);
            let roleMessage = await waitResponse(client, message, message.author, 5 * 60);
            if (!roleMessage) {
                queryMessage.delete();
                message.reply("Cancelling rolemenu.");
                isDone = true;
                continue;
            }

            // Check that the role exists
            let roleName;
            if (message.guild.roles.cache.some(role => `<@&${role.id}>` === roleMessage.content)) {
                roleName = message.guild.roles.cache.find(role => `<@&${role.id}>` === roleMessage.content).name;
                roleFound = true;
            }

            if (!roleFound) {
                message.channel.send("I couldn't find that role.");
                continue;
            }

            let role = message.guild.roles.cache.find(role => role.name === roleName);

            // Check that we have permission to assign that role
            const botHighestRole = message.guild.members.cache.find(member => member.id === client.user.id).roles.highest;
            if (botHighestRole.comparePositionTo(role) < 0) {
                await message.reply("I can't assign that role to people! My role in the server's role list must be above any roles that you want me to assign.");
                roleFound = false;
                continue;
            }

            // Add to roleOptions
            roleOptions.push({
                emoji: responseEmoji,
                roleID: role.id
            });

            // Edit rolemenu text
            roleMenuString = roleMenuString.slice(0, roleMenuString.length - 6);
            roleMenuString += `${role}\n`;
            roleMenuEmbed.setDescription(roleMenuString);
            roleMenuMessage.edit(roleMenuEmbed);

            queryMessage.delete();
            roleMessage.delete();

            await message.channel.send(`${responseEmoji} added to role menu!`);
        }
    }
}

async function updateRoleMenu(client, message, args, settings) {
    if (args.includes("update")) {
        if (args[args.indexOf("update") + 1]) { // argument after "update"
            if (client.databaseCache.roleMenus.has(args[args.indexOf("update") + 1])) { // message ID is for a role menu
                let cachedRoleMenu = client.databaseCache.roleMenus.get(args[args.indexOf("update") + 1]);
                const roleMenuMessage = client.channels.cache.get(cachedRoleMenu.channelID).messages.cache.get(cachedRoleMenu.messageID);

                let roleMenuString = "";
                for (const option of cachedRoleMenu.roleOptions) {
                    roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
                }

                const roleMenuEmbed = new MessageEmbed()
                    .setTitle(cachedRoleMenu.roleMenuTitle)
                    .setDescription(roleMenuString)
                    .setColor("YELLOW")
                    .setFooter("React with one of the above emojis to receive the specified role!");

                await roleMenuMessage.edit(roleMenuEmbed);

                const updateEmbed = new MessageEmbed()
                    .setTitle("Update Role Menu")
                    .setDescription(stripIndents`Please select an option from below:
                1) \`Update title\`
                2) \`Add role option\`
                3) \`Remove role option\``)
                    .setColor("PURPLE");

                message.channel.send(updateEmbed).then(async msg => {
                    const ONE_EMOJI = "1️⃣";
                    const TWO_EMOJI = "2️⃣";
                    const THREE_EMOJI = "3️⃣";

                    const emoji = await promptMessage(msg, message.author, 30, [ONE_EMOJI, TWO_EMOJI, THREE_EMOJI]);
                    await msg.delete();

                    switch (emoji) {
                        case ONE_EMOJI: {
                            updateEmbed.setDescription("Please enter the new title.");
                            let updateEmbedMessage = await message.channel.send(updateEmbed);
                            let newTitleMessage = await waitResponse(client, message, message.author, 5 * 60);

                            roleMenuEmbed
                                .setTitle(newTitleMessage.content)
                                .setColor("BLUE");
                            await roleMenuMessage.edit(roleMenuEmbed);
                            updateEmbedMessage.delete();
                            newTitleMessage.delete();
                            await message.reply("Rolemenu updated!");

                            // Update cache and database
                            cachedRoleMenu.roleMenuTitle = newTitleMessage.content;
                            client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);
                            break;
                        }
                        case TWO_EMOJI: {
                            let roleOptions = cachedRoleMenu.roleOptions.toObject();

                            let isDone = false;
                            while (!isDone) {
                                let retry = false;
                                const emojiQueryEmbed = new MessageEmbed()
                                    .setTitle("Update Role Menu")
                                    .setDescription("What's the emoji to use? Type `done` to finish.")
                                    .setColor("YELLOW");

                                let queryMessage = await message.channel.send(emojiQueryEmbed);
                                let responseEmojiMessage = await waitResponse(client, message, message.author, 5 * 60);
                                if (!responseEmojiMessage) {
                                    queryMessage.delete();
                                    message.reply("Cancelling rolemenu update.");
                                    await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                    isDone = true;
                                    continue;
                                } else if (responseEmojiMessage.content.toLowerCase() == "done") {
                                    await queryMessage.delete();
                                    await responseEmojiMessage.delete();
                                    await roleMenuMessage.edit(roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"));
                                    await message.reply("Rolemenu updated!");

                                    // Update cache and database
                                    cachedRoleMenu.roleOptions = roleOptions;
                                    client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);

                                    isDone = true;
                                    continue;
                                }

                                for (let option of roleOptions) {
                                    if (option.emoji === responseEmojiMessage.content) {
                                        message.channel.send("That emoji is already being used!");
                                        retry = true;
                                        break;
                                    }
                                }
                                if (retry) continue;

                                await roleMenuMessage.react(responseEmojiMessage.content)
                                    .catch((err) => {
                                        message.channel.send("I had trouble reacting with that emoji...");
                                        console.error("roleMenu react error: ", err);
                                        retry = true;
                                    });
                                if (retry) continue;

                                roleMenuString += `${responseEmojiMessage.content}: \`none\``;
                                roleMenuEmbed.setDescription(roleMenuString);
                                roleMenuMessage.edit(roleMenuEmbed);

                                queryMessage.delete();
                                let responseEmoji = responseEmojiMessage.content;
                                responseEmojiMessage.delete();

                                let roleFound = false;
                                while (!roleFound) {
                                    const roleQueryEmbed = new MessageEmbed()
                                        .setTitle("Update Role Menu")
                                        .setDescription(`What role should ${responseEmoji} assign? eg. @everyone`)
                                        .setColor("YELLOW");

                                    queryMessage = await message.channel.send(roleQueryEmbed);
                                    let roleMessage = await waitResponse(client, message, message.author, 5 * 60);
                                    if (!roleMessage) {
                                        queryMessage.delete();
                                        message.reply("Cancelling rolemenu update.");
                                        await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                        isDone = true;
                                        continue;
                                    }

                                    // Check that the role exists
                                    let roleName;
                                    if (message.guild.roles.cache.some(role => `<@&${role.id}>` === roleMessage.content)) {
                                        roleName = message.guild.roles.cache.find(role => `<@&${role.id}>` === roleMessage.content).name;
                                        roleFound = true;
                                    }

                                    if (!roleFound) {
                                        message.channel.send("I couldn't find that role.");
                                        continue;
                                    }

                                    let role = message.guild.roles.cache.find(role => role.name === roleName);

                                    // Check that we have permission to assign that role
                                    const botHighestRole = message.guild.members.cache.find(member => member.id === client.user.id).roles.highest;
                                    if (botHighestRole.comparePositionTo(role) < 0) {
                                        await message.reply("I can't assign that role to people! My role in the server's role list must be above any roles that you want me to assign.");
                                        roleFound = false;
                                        continue;
                                    }

                                    // Add to roleOptions
                                    roleOptions.push({
                                        emoji: responseEmoji,
                                        roleID: role.id
                                    });

                                    // Edit rolemenu text
                                    roleMenuString = roleMenuString.slice(0, roleMenuString.length - 6);
                                    roleMenuString += `${role}\n`;
                                    roleMenuEmbed.setDescription(roleMenuString);
                                    roleMenuMessage.edit(roleMenuEmbed);

                                    queryMessage.delete();
                                    roleMessage.delete();

                                    await message.channel.send(`${responseEmoji} added to role menu!`);
                                }
                            }

                            await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                            break;
                        }
                        case THREE_EMOJI: {
                            let roleOptions = cachedRoleMenu.roleOptions.toObject();

                            let isDone = false;
                            while (!isDone) {
                                const emojiQueryEmbed = new MessageEmbed()
                                    .setTitle("Update Role Menu")
                                    .setDescription("What's the emoji to remove? Type `done` to finish.")
                                    .setColor("YELLOW");

                                let queryMessage = await message.channel.send(emojiQueryEmbed);
                                let responseEmojiMessage = await waitResponse(client, message, message.author, 5 * 60);
                                if (!responseEmojiMessage) {
                                    queryMessage.delete();
                                    message.reply("Cancelling rolemenu update.");
                                    await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                    isDone = true;
                                    continue;
                                } else if (responseEmojiMessage.content.toLowerCase() == "done") {
                                    await queryMessage.delete();
                                    await responseEmojiMessage.delete();
                                    await roleMenuMessage.edit(roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"));
                                    await message.reply("Rolemenu updated!");

                                    // Update cache and database
                                    cachedRoleMenu.roleOptions = roleOptions;
                                    client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);

                                    isDone = true;
                                    continue;
                                }

                                let removedEmoji = false;
                                for (let option of roleOptions) {
                                    if (option.emoji === responseEmojiMessage.content) {
                                        removedEmoji = true;
                                        break;
                                    }
                                }

                                roleOptions = await roleOptions.filter(option => option.emoji !== responseEmojiMessage.content);

                                if (!removedEmoji) {
                                    message.channel.send("That emoji isn't an option to choose from!");
                                    continue;
                                }

                                if (roleMenuMessage.reactions.cache.has(responseEmojiMessage.content)) {
                                    roleMenuMessage.reactions.cache.get(responseEmojiMessage.content).remove().catch((err) => {
                                        console.error("roleMenu remove reaction error: ", err);
                                    });
                                }

                                roleMenuString = "";
                                for (const option of roleOptions) {
                                    roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
                                }

                                roleMenuEmbed.setDescription(roleMenuString);
                                roleMenuMessage.edit(roleMenuEmbed);

                                queryMessage.delete();
                                let responseEmoji = responseEmojiMessage.content;
                                responseEmojiMessage.delete();

                                await message.channel.send(`${responseEmoji} removed from role menu!`);
                            }

                            await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));

                            break;
                        }
                        default: { // user didn't react in time
                            message.reply("Cancelling role menu update.");
                        }
                    }
                });
            } else { // message ID isn't a role menu
                message.channel.send("I couldn't find a role menu with that message ID.");

                return;
            }
        } else { // no argument after "update"
            message.channel.send("Please specify a message ID after `update`.");

            return;
        }
    } else if (args.includes("edit")) {
        if (args[args.indexOf("edit") + 1]) { // argument after "edit"
            if (client.databaseCache.roleMenus.has(args[args.indexOf("edit") + 1])) { // message ID is for a role menu
                let cachedRoleMenu = client.databaseCache.roleMenus.get(args[args.indexOf("edit") + 1]);
                const roleMenuMessage = client.channels.cache.get(cachedRoleMenu.channelID).messages.cache.get(cachedRoleMenu.messageID);

                let roleMenuString = "";
                for (const option of cachedRoleMenu.roleOptions) {
                    roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
                }

                const roleMenuEmbed = new MessageEmbed()
                    .setTitle(cachedRoleMenu.roleMenuTitle)
                    .setDescription(roleMenuString)
                    .setColor("YELLOW")
                    .setFooter("React with one of the above emojis to receive the specified role!");

                await roleMenuMessage.edit(roleMenuEmbed);

                const updateEmbed = new MessageEmbed()
                    .setTitle("Update Role Menu")
                    .setDescription(stripIndents`Please select an option from below:
            1) \`Update title\`
            2) \`Add role option\`
            3) \`Remove role option\``)
                    .setColor("PURPLE");

                message.channel.send(updateEmbed).then(async msg => {
                    const ONE_EMOJI = "1️⃣";
                    const TWO_EMOJI = "2️⃣";
                    const THREE_EMOJI = "3️⃣";

                    const emoji = await promptMessage(msg, message.author, 30, [ONE_EMOJI, TWO_EMOJI, THREE_EMOJI]);
                    await msg.delete();

                    switch (emoji) {
                        case ONE_EMOJI: {
                            updateEmbed.setDescription("Please enter the new title.");
                            let updateEmbedMessage = await message.channel.send(updateEmbed);
                            let newTitleMessage = await waitResponse(client, message, message.author, 5 * 60);

                            roleMenuEmbed
                                .setTitle(newTitleMessage.content)
                                .setColor("BLUE");
                            await roleMenuMessage.edit(roleMenuEmbed);
                            updateEmbedMessage.delete();
                            newTitleMessage.delete();
                            await message.reply("Rolemenu updated!");

                            // Update cache and database
                            cachedRoleMenu.roleMenuTitle = newTitleMessage.content;
                            client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);
                            break;
                        }
                        case TWO_EMOJI: {
                            let roleOptions = cachedRoleMenu.roleOptions.toObject();

                            let isDone = false;
                            while (!isDone) {
                                let retry = false;
                                const emojiQueryEmbed = new MessageEmbed()
                                    .setTitle("Update Role Menu")
                                    .setDescription("What's the emoji to use? Type `done` to finish.")
                                    .setColor("YELLOW");

                                let queryMessage = await message.channel.send(emojiQueryEmbed);
                                let responseEmojiMessage = await waitResponse(client, message, message.author, 5 * 60);
                                if (!responseEmojiMessage) {
                                    queryMessage.delete();
                                    message.reply("Cancelling rolemenu update.");
                                    await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                    isDone = true;
                                    continue;
                                } else if (responseEmojiMessage.content.toLowerCase() == "done") {
                                    await queryMessage.delete();
                                    await responseEmojiMessage.delete();
                                    await roleMenuMessage.edit(roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"));
                                    await message.reply("Rolemenu updated!");

                                    // Update cache and database
                                    cachedRoleMenu.roleOptions = roleOptions;
                                    client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);

                                    isDone = true;
                                    continue;
                                }

                                for (let option of roleOptions) {
                                    if (option.emoji === responseEmojiMessage.content) {
                                        message.channel.send("That emoji is already being used!");
                                        retry = true;
                                        break;
                                    }
                                }
                                if (retry) continue;

                                await roleMenuMessage.react(responseEmojiMessage.content)
                                    .catch((err) => {
                                        message.channel.send("I had trouble reacting with that emoji...");
                                        console.error("roleMenu react error: ", err);
                                        retry = true;
                                    });
                                if (retry) continue;

                                roleMenuString += `${responseEmojiMessage.content}: \`none\``;
                                roleMenuEmbed.setDescription(roleMenuString);
                                roleMenuMessage.edit(roleMenuEmbed);

                                queryMessage.delete();
                                let responseEmoji = responseEmojiMessage.content;
                                responseEmojiMessage.delete();

                                let roleFound = false;
                                while (!roleFound) {
                                    const roleQueryEmbed = new MessageEmbed()
                                        .setTitle("Update Role Menu")
                                        .setDescription(`What role should ${responseEmoji} assign? eg. @everyone`)
                                        .setColor("YELLOW");

                                    queryMessage = await message.channel.send(roleQueryEmbed);
                                    let roleMessage = await waitResponse(client, message, message.author, 5 * 60);
                                    if (!roleMessage) {
                                        queryMessage.delete();
                                        message.reply("Cancelling rolemenu update.");
                                        await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                        isDone = true;
                                        continue;
                                    }

                                    // Check that the role exists
                                    let roleName;
                                    if (message.guild.roles.cache.some(role => `<@&${role.id}>` === roleMessage.content)) {
                                        roleName = message.guild.roles.cache.find(role => `<@&${role.id}>` === roleMessage.content).name;
                                        roleFound = true;
                                    }

                                    if (!roleFound) {
                                        message.channel.send("I couldn't find that role.");
                                        continue;
                                    }

                                    let role = message.guild.roles.cache.find(role => role.name === roleName);

                                    // Check that we have permission to assign that role
                                    const botHighestRole = message.guild.members.cache.find(member => member.id === client.user.id).roles.highest;
                                    if (botHighestRole.comparePositionTo(role) < 0) {
                                        await message.reply("I can't assign that role to people! My role in the server's role list must be above any roles that you want me to assign.");
                                        roleFound = false;
                                        continue;
                                    }

                                    // Add to roleOptions
                                    roleOptions.push({
                                        emoji: responseEmoji,
                                        roleID: role.id
                                    });

                                    // Edit rolemenu text
                                    roleMenuString = roleMenuString.slice(0, roleMenuString.length - 6);
                                    roleMenuString += `${role}\n`;
                                    roleMenuEmbed.setDescription(roleMenuString);
                                    roleMenuMessage.edit(roleMenuEmbed);

                                    queryMessage.delete();
                                    roleMessage.delete();

                                    await message.channel.send(`${responseEmoji} added to role menu!`);
                                }
                            }

                            await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                            break;
                        }
                        case THREE_EMOJI: {
                            let roleOptions = cachedRoleMenu.roleOptions.toObject();

                            let isDone = false;
                            while (!isDone) {
                                const emojiQueryEmbed = new MessageEmbed()
                                    .setTitle("Update Role Menu")
                                    .setDescription("What's the emoji to remove? Type `done` to finish.")
                                    .setColor("YELLOW");

                                let queryMessage = await message.channel.send(emojiQueryEmbed);
                                let responseEmojiMessage = await waitResponse(client, message, message.author, 5 * 60);
                                if (!responseEmojiMessage) {
                                    queryMessage.delete();
                                    message.reply("Cancelling rolemenu update.");
                                    await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));
                                    isDone = true;
                                    continue;
                                } else if (responseEmojiMessage.content.toLowerCase() == "done") {
                                    await queryMessage.delete();
                                    await responseEmojiMessage.delete();
                                    await roleMenuMessage.edit(roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"));
                                    await message.reply("Rolemenu updated!");

                                    // Update cache and database
                                    cachedRoleMenu.roleOptions = roleOptions;
                                    client.updateRoleMenu(cachedRoleMenu.messageID, cachedRoleMenu);

                                    isDone = true;
                                    continue;
                                }

                                let removedEmoji = false;
                                for (let option of roleOptions) {
                                    if (option.emoji === responseEmojiMessage.content) {
                                        removedEmoji = true;
                                        break;
                                    }
                                }

                                roleOptions = await roleOptions.filter(option => option.emoji !== responseEmojiMessage.content);

                                if (!removedEmoji) {
                                    message.channel.send("That emoji isn't an option to choose from!");
                                    continue;
                                }

                                if (roleMenuMessage.reactions.cache.has(responseEmojiMessage.content)) {
                                    roleMenuMessage.reactions.cache.get(responseEmojiMessage.content).remove().catch((err) => {
                                        console.error("roleMenu remove reaction error: ", err);
                                    });
                                }

                                roleMenuString = "";
                                for (const option of roleOptions) {
                                    roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
                                }

                                roleMenuEmbed.setDescription(roleMenuString);
                                roleMenuMessage.edit(roleMenuEmbed);

                                queryMessage.delete();
                                let responseEmoji = responseEmojiMessage.content;
                                responseEmojiMessage.delete();

                                await message.channel.send(`${responseEmoji} removed from role menu!`);
                            }

                            await roleMenuMessage.edit(roleMenuEmbed.setColor("BLUE"));

                            break;
                        }
                        default: { // user didn't react in time
                            message.reply("Cancelling role menu update.");
                        }
                    }
                });
            } else { // message ID isn't a role menu
                message.channel.send("I couldn't find a role menu with that message ID.");

                return;
            }
        } else { // no argument after "edit"
            message.channel.send("Please specify a message ID after `edit`.");

            return;
        }
    }
}

async function removeRoleMenu(client, message, args, settings) {
    const CONFIRM = "💯";
    const CANCEL = "\u274c";    // red "X" emoji


    if (args.includes("delete")) {
        if (args[args.indexOf("delete") + 1]) { // argument after "delete"
            if (client.databaseCache.roleMenus.has(args[args.indexOf("delete") + 1])) { // message ID is for a role menu
                let cachedRoleMenu = client.databaseCache.roleMenus.get(args[args.indexOf("delete") + 1]);
                const roleMenuMessage = client.channels.cache.get(cachedRoleMenu.channelID).messages.cache.get(cachedRoleMenu.messageID);

                const confirmDeleteEmbed = new MessageEmbed()
                    .setColor("RED")
                    .setDescription("Confirm role menu deletion?")
                    .setAuthor("This verification becomes invalid after 30s");
                message.channel.send(confirmDeleteEmbed).then(async msg => {
                    const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

                    msg.delete();
                    switch (emoji) {
                        case CONFIRM: {
                            if (roleMenuMessage.deletable) roleMenuMessage.delete();

                            // remove role menu from database and cache
                            RoleMenu.deleteOne({ messageID: cachedRoleMenu.messageID }).catch((err) => {
                                console.error("Couldn't delete role menu from database: ", err);
                            });
                            client.databaseCache.roleMenus.delete(cachedRoleMenu.messageID);

                            message.channel.send("Successfully deleted role menu.");

                            if (settings.logMessages.enabled) {
                                // Log activity
                                if (message.guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                                    const logEmbed = new MessageEmbed()
                                        .setColor("RED")
                                        .setFooter(message.member.displayName, message.author.displayAvatarURL())
                                        .setTimestamp()
                                        .setTitle("Removed Role Menu")
                                        .setDescription(stripIndents`**\\> Removed by: ${message.member}**`);

                                    const logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                                    logChannel.send(logEmbed).catch((err) => {
                                        // Most likely don't have permissions to type
                                        message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                                    });
                                } else { // channel was removed, disable logging in settings
                                    client.updateGuild(message.guild, {
                                        logMessages: {
                                            enabled: false,
                                            channelID: null
                                        }
                                    });
                                }
                            }
                            break;
                        } case CANCEL: {
                            message.reply("Deletion cancelled.")
                                .then(m => m.delete({
                                    timeout: 5000
                                }));
                            break;
                        }
                    }
                });
            }
        } else { // no argument after "delete"
            message.channel.send("Please specify a message ID after `delete`.");

            return;
        }
    } else if (args.includes("remove")) {
        if (args[args.indexOf("remove") + 1]) { // argument after "remove"
            if (client.databaseCache.roleMenus.has(args[args.indexOf("remove") + 1])) { // message ID is for a role menu
                let cachedRoleMenu = client.databaseCache.roleMenus.get(args[args.indexOf("remove") + 1]);
                const roleMenuMessage = client.channels.cache.get(cachedRoleMenu.channelID).messages.cache.get(cachedRoleMenu.messageID);

                const confirmDeleteEmbed = new MessageEmbed()
                    .setColor("RED")
                    .setDescription("Confirm role menu deletion?")
                    .setAuthor("This verification becomes invalid after 30s");
                message.channel.send(confirmDeleteEmbed).then(async msg => {
                    const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

                    msg.delete();
                    switch (emoji) {
                        case CONFIRM: {
                            if (roleMenuMessage.deletable) roleMenuMessage.delete();

                            // remove role menu from database and cache
                            RoleMenu.deleteOne({ messageID: cachedRoleMenu.messageID }).catch((err) => {
                                console.error("Couldn't delete role menu from database: ", err);
                            });
                            client.databaseCache.roleMenus.delete(cachedRoleMenu.messageID);

                            message.channel.send("Successfully deleted role menu.");

                            if (settings.logMessages.enabled) {
                                // Log activity
                                if (message.guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                                    const logEmbed = new MessageEmbed()
                                        .setColor("RED")
                                        .setFooter(message.member.displayName, message.author.displayAvatarURL())
                                        .setTimestamp()
                                        .setTitle("Removed Role Menu")
                                        .setDescription(stripIndents`**\\> Removed by: ${message.member}**`);

                                    const logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                                    logChannel.send(logEmbed).catch((err) => {
                                        // Most likely don't have permissions to type
                                        message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                                    });
                                } else { // channel was removed, disable logging in settings
                                    client.updateGuild(message.guild, {
                                        logMessages: {
                                            enabled: false,
                                            channelID: null
                                        }
                                    });
                                }
                            }
                            break;
                        } case CANCEL: {
                            message.reply("Deletion cancelled.")
                                .then(m => m.delete({
                                    timeout: 5000
                                }));
                            break;
                        }
                    }
                });
            }
        } else { // no argument after "remove"
            message.channel.send("Please specify a message ID after `remove`.");

            return;
        }
    }
}