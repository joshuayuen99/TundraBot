const mongoose = require("mongoose");
const { Guild, Message } = require("../models");

module.exports = (client) => {
    client.getGuild = async (guild) => {
        let data = await Guild.findOne({ guildID: guild.id }).toObject;
        if (data) return data;
        else return client.config.defaultGuildSettings;
    };

    client.updateGuild = async (guild, settings) => {
        let data = await client.getGuild(guild);

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else return;
        }

        await Guild.findOneAndUpdate({ guildID: guild.id }, data);
        return console.log(`Guild "${data.guildName}" updated settings: ${Object.keys(settings)}`);
    };

    client.addMessage = async (message, settings) => {
        const newMessage = await new Message({
            _id: new mongoose.Types.ObjectId(),
            message: {
                text: message.content,
                command: message.content.split(" ")[0].slice(settings.prefix.length).toLowerCase(),
                userID: message.author.id,
                username: message.author.username
            },
        });
        
        await newMessage.save();
        await Guild.findOneAndUpdate( { guildID: message.guild.id }, {
            $push: {messages: newMessage._id }})
            .catch((err) => {
                console.error("Error adding message to database: ", err);
            });
        // await guildObject.messages.push(newMessage._id);
        // await guildObject.save();

        return;

        await Guild.findOneAndUpdate({ guildID: messageObject.guildID }, { $push: {messages: messageObject }}).catch((err) => {
            console.error("Error adding message to guild: ", err);
        });
    }

    client.createGuild = async (settings) => {
        let defaults = Object.assign({ _id: mongoose.Types.ObjectId() }, client.config.defaultGuildSettings);
        let merged = Object.assign(defaults, settings);

        const newGuild = await new Guild(merged);
        return newGuild.save()
            .then(console.log(`Default settings saved for guild "${merged.guildName}" (${merged.guildID})`));
    };

    client.clean = async (client, text) => {
        if (typeof(text) === "string") {
            text = text
                .replace(/`/g, "`" + String.fromCharCode(8203))
                .replace(/@/g, "@" + String.fromCharCode(8203))
                .replace(client.token, "YEET")
                .replace(process.env.DISCORDTOKEN, "YEET")
                .replace(process.env.YOUTUBEKEY, "YEET")
                .replace(process.env.MONGOOSE_URL, "YEET")
                .replace(process.env.MONGOOSE_USERNAME, "YEET")
                .replace(process.env.MONGOOSE_PASSWORD, "YEET");

                return text;
        } else {
            return text;
        }
    }
}