const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { formatDate } = require("../functions");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message
*/
module.exports = async (client, message) => {
    if (message.author.bot) return;  // if a bot sent the message

    /*
    // Will Sniper
    if(message.author.id === "94164958056558592") {
        if(message.attachments && !message.content) {
            const sentMessage = await message.channel.send("POST THE DAMN SOURCE REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
            sentMessage.pin();
        }
    }
    */
    /*
    // Josh Sniper
    if(message.author.id === "114848659891290118") {
        if(message.attachments && !message.content) {
            const sentMessage = await message.channel.send("@everyone POST THE DAMN SOURCE REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
            sentMessage.pin();
        }
    }
    */

    // If the message was not sent in a server
    if (!message.guild) {
        const owner = await client.users.fetch(process.env.OWNERID);
        const messageContent = message.content;
        const messageAttachments = message.attachments;

        const embedMsg = new MessageEmbed()
            .setColor("#0d6adb")
            .setTimestamp(message.createdAt)
            .setFooter(message.author.username, message.author.displayAvatarURL())
            .setDescription("Attempted DM")
            .addField("User information", stripIndents`**\\> ID:** ${message.author.id}
            **\\> Username:** ${message.author.username}
            **\\> Discord Tag:** ${message.author.tag}
            **\\> Created account:** ${formatDate(message.author.createdAt)}`, true);

        if (messageContent) {    // If there is text in the DM
            embedMsg.addField("Text:", messageContent)
        }
        if (messageAttachments.first()) { // If there is an attachment in the DM
            messageAttachments.forEach(attachment => {
                embedMsg.addField("Attachment:", attachment.url);
            });
            embedMsg.setImage(messageAttachments.first().url);
            /*
            let attachments = messageAttachments.find(attachment => attachment.id).url;

            embedMsg.addField("Attachments:", attachments)
            embedMsg.setImage(attachments);
            */
        }

        owner.send(embedMsg);

        return;

        // return message.channel.send(`Message my master ${process.env.OWNERNAME}${process.env.OWNERTAG} instead!`);
    }

    let settings;
    try {
        settings = await client.getGuild(message.guild);
    } catch (err) {
        console.error("message event error: ", err);
    }

    if (message.content) {
        // Save to database
        client.createMessage(message, settings);
    }

    // Sent in a guild

    // Sent in a blacklisted channel
    if (settings.blacklistedChannelIDs.includes(message.channel.id)) return;

    // @TundraBot
    if (message.content.trim() === `<@${client.user.id}>` || message.content.trim() === `<@!${client.user.id}>`) {
        message.channel.send(`My prefix in this server is \`${settings.prefix}\``);
        return;
    }

    // Did not contain the command prefix
    if (!message.content.trim().startsWith(settings.prefix)) return;
    if (!message.member) message.member = await message.guild.members.fetch(message.member);

    // If we are waiting on a response from this member, skip the regular command handler
    if (client.waitingResponse.has(message.author.id)) return;

    const messageArray = message.content.replace(/\s\s+/g, " ").split(" ");
    const cmd = messageArray[0].slice(settings.prefix.length).toLowerCase();
    const args = messageArray.slice(1);

    if (cmd.length === 0) return;

    let command = client.commands.get(cmd); // Set the command to call
    if (!command) command = client.commands.get(client.aliases.get(cmd));    // If the command was not found, check aliases

    if (command) {
        command.run(client, message, args, settings)
            .catch((err) => {
                console.error(`Error running command <${cmd}>: `, err);
            });
    }
};