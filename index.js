const { Client, RichEmbed, Collection } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs");

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
            name: "~help",
            type: "WATCHING",
        }
    });
});

client.on("guildMemberRemove", async member => {
    const guild = member.guild;
    const micon = member.user.displayAvatarURL;

    const embedMsg = new RichEmbed()
        .setDescription(`${member.user.username} left the server`)
        .setColor("RED")
        .setThumbnail(micon)
        .addField(`${member.user.username} joined`, member.joinedAt)
        .addField("New total members", guild.memberCount)
        .setTimestamp();
    
    return guild.channels.find(channel => channel.name === "admin").send(embedMsg);
});

client.on("guildMemberAdd", async member => {
    const guild = member.guild;
    const micon = member.user.displayAvatarURL;

    const embedMsg = new RichEmbed()
        .setDescription(`${member.user.username} joined the server`)
        .setColor("GREEN")
        .setThumbnail(micon)
        .addField(`${member.user.username} joined`, member.joinedAt)
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

    if(!message.guild) return message.channel.send("Message my master TundraBuddy#4650 instead!");  // if the message was not sent in a server
    if(!message.content.startsWith(prefix)) return; // if the message did not contain the command prefix
    if(!message.member) message.member = await message.guild.fetchMember(message.member);

    const messageArray = message.content.split(" ");
    const cmd = messageArray[0].slice(prefix.length);
    const args = messageArray.slice(1);

    if(cmd.length === 0) return;

    let command = client.commands.get(cmd); // Set the command to call
    if(!command) command = client.commands.get(client.aliases.get(cmd));    // If the command was not found, check aliases

    if(command) {
        command.run(client, message, args);
    }
});

client.login(process.env.TOKEN);