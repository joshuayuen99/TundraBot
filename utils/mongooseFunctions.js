const mongoose = require("mongoose");
const { Guild, User, Message } = require("../models");

module.exports = (client) => {
    client.getGuild = async (guild) => {
        return Guild.findOne({ guildID: guild.id })
            .then((guild, err) => {
                if (err) console.error(err);

                if (guild) return guild.toObject();
                else return client.config.defaultGuildSettings;
            });
    };

    client.updateGuild = async (guild, settings) => {
        let data = await client.getGuild(guild);

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else return;
        }

        await Guild.findOneAndUpdate({ guildID: guild.id }, data)
            .catch((err) => {
                console.error("Error updating guild in database: ", err);
            });
        console.log(`Guild "${data.guildName}" updated settings: ${Object.keys(settings)}`);
        return;
    };

    client.createGuild = async (settings) => {
        let defaults = Object.assign({ _id: mongoose.Types.ObjectId() }, client.config.defaultGuildSettings);
        let merged = Object.assign(defaults, settings);

        const newGuild = await new Guild(merged);
        newGuild.save()
            .then(console.log(`Default settings saved for guild "${merged.guildName}" (${merged.guildID})`))
            .catch((err) => {
                console.error("Error adding guild to database: ", err);
            });

        return;
    };

    client.createMessage = async (message, settings) => {
        const newMessage = await new Message({
            _id: new mongoose.Types.ObjectId(),
            text: message.content,
            command: message.content.split(" ")[0].slice(settings.prefix.length).toLowerCase(),
            userID: message.author.id,
            username: message.author.username,
            guildID: message.guild.id
        });

        await newMessage.save().catch((err) => {
            console.error("Error saving message to database: ", err);
        });
        await Guild.findOneAndUpdate({ guildID: message.guild.id }, {
            $push: { messages: newMessage._id }
        }).catch((err) => {
            console.error("Error linking message to guild in database: ", err);
        });

        return;
    };

    client.getUser = async (user) => {
        return User.findOne({ userID: user.id })
            .then((user, err) => {
                if (err) console.error(err);

                if (user) return user.toObject();
                else return null;
            });
    };

    client.updateUser = async (user, guild, settings) => {
        let data = await client.getUser(user).settings;
        let guildObject = await client.getGuild(guild);

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else return;
        }

        await User.findOneAndUpdate({ userID: user.id }, {
            settings: data,
            $addToSet: { guilds: guildObject._id },
        }).catch((err) => {
            console.error("Error updating user settings in database: ", err);
        });

        // if (guild) {
        //     await User.findOneAndUpdate({ userID: user.id }, {
        //         $addToSet: { guilds: await client.getGuild(guild)._id }
        //     }).catch((err) => {
        //         console.error("Error updating user guilds in database: ", err);
        //     });
        // }
        // if (timezone) {
        //     await User.findOneAndUpdate({ userID: user.id }, {
        //         $addToSet: { guilds: await client.getGuild(guild)._id },
        //         timezone: timezone
        //     }).catch((err) => {
        //         console.error("Error updating user timezone in database: ", err);
        //     });
        // }
        return client.getUser(user);
    }

    client.createUser = async (user, guild) => {
        const guildObject = await client.getGuild(guild);
        const newUser = await new User({
            _id: new mongoose.Types.ObjectId(),
            userID: user.id,
            guilds: [guildObject._id]
        });

        return await newUser.save().catch((err) => {
            console.error("Error creating new user in database: ", err);
        });
    };

    client.clean = async (client, text) => {
        if (typeof (text) === "string") {
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