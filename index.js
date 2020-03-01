const { Client, RichEmbed, Collection } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs");
const { stripIndents } = require("common-tags");
const { formatDate, formatDateLong } = require("./functions.js");

const client = new Client({
    disableEveryone: false
});

config({
    path: __dirname + "/.env"
});

const prefix = "~";

client.commands = new Collection();
client.aliases = new Collection();

client.categories = fs.readdirSync("./commands/");

["command"].forEach(handler => {
    require(`./handler/${handler}`)(client);
});

client.on("ready", () => {
    console.log(`I'm now online, my name is ${client.user.username}`);

    client.user.setPresence({
        status: "online",
        game: {
            name: "~help ~suggestion",
            type: "WATCHING",
        }
    });
});

// Map with guilds playing music ?
client.musicGuilds = new Map();

// When someone leaves the guild
client.on("guildMemberRemove", async member => {
    const guild = member.guild;
    const micon = member.user.displayAvatarURL;

    const embedMsg = new RichEmbed()
        .setDescription(`${member.user.username} left the server`)
        .setColor("RED")
        .setThumbnail(micon)
        .addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
        .addField("New total members", guild.memberCount)
        .setTimestamp();
    
    return guild.channels.find(channel => channel.name === "admin").send(embedMsg);
});

// When someone joins the guild
client.on("guildMemberAdd", async member => {
    const guild = member.guild;
    const micon = member.user.displayAvatarURL;
    
    const embedMsg = new RichEmbed()
        .setDescription(`${member.user.username} joined the server`)
        .setColor("GREEN")
        .setThumbnail(micon)
        .addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
        .addField("New total members", guild.memberCount)
        .setTimestamp();
    
    return guild.channels.find(channel => channel.name === "admin").send(embedMsg);
});

client.on("message", async message => {
    if(message.author.bot) return;  // if a bot sent the message

    // Will Sniper
    if(message.author.id === "94164958056558592") {
        if(message.attachments && !message.content) {
            const sentMessage = await message.channel.send("@everyone POST THE DAMN SOURCE REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
            sentMessage.pin();
        }
    }
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
    if(!message.guild) {
        const owner = await client.fetchUser(process.env.OWNERID);
        const messageAuthor = message.author;
        const messageContent = message.content;
        const messageAttachments = message.attachments;

        const embedMsg = new RichEmbed()
            .setColor("#0d6adb")
            .setTimestamp(message.createdAt)
            .setFooter(message.author.username, message.author.displayAvatarURL)

            .setDescription("Attempted DM")
            .addField("User information", stripIndents`**\\> ID:** ${message.author.id}
            **\\> Username:** ${message.author.username}
            **\\> Discord Tag:** ${message.author.tag}
            **\\> Created account:** ${formatDate(message.author.createdAt)}`, true)

        if(messageContent) {    // If there is text in the DM
            embedMsg.addField("Text:", messageContent)
        }
        if(messageAttachments.first()) { // If there is an attachment in the DM
            let attachments = messageAttachments.find(attachment => attachment.id).url;

            embedMsg.addField("Attachments:", attachments)
            embedMsg.setImage(attachments);
        }

        owner.send(embedMsg);

        return message.channel.send("Message my master TundraBuddy#4650 instead!");
    }
    if(!message.content.startsWith(prefix)) return; // if the message did not contain the command prefix
    if(!message.member) message.member = await message.guild.fetchMember(message.member);

    const messageArray = message.content.split(" ");
    const cmd = messageArray[0].slice(prefix.length).toLowerCase();
    const args = messageArray.slice(1);

    if(cmd.length === 0) return;

    let command = client.commands.get(cmd); // Set the command to call
    if(!command) command = client.commands.get(client.aliases.get(cmd));    // If the command was not found, check aliases

    if(command) {
        try{
            command.run(client, message, args);
        } catch(err) {
            console.log(err);
        }
    }
});

client.login(process.env.TOKEN);