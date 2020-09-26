const mongoose = require("mongoose");
const { Guild, User, Channel, Message } = require("../models");

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
            .then(() => {
                console.log(`Default settings saved for guild "${merged.guildName}" (${merged.guildID})`);
                
                let guild = client.guilds.cache.get(newGuild.guildID);
                let channels = guild.channels.cache;
                channels.forEach(channel => {
                    client.createChannel(channel);
                });
            }).catch((err) => {
                console.error("Error adding guild to database: ", err);
            });

        return;
    };

    client.getChannel = async (channel) => {
        return Channel.findOne({ channelID: channel.id })
            .then((channel, err) => {
                if (err) console.error(err);

                if (channel) return channel.toObject();
                else return null;
            });
    };

    client.updateChannel = async (channel, settings) => {
        let data = await client.getChannel(channel);

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else return;
        }

        await Channel.findOneAndUpdate({ channelID: channel.id }, data)
            .catch((err) => {
                console.error("Error updating channel in database: ", err);
            });
        return;
    };

    client.createChannel = async (channel) => {
        let guildObject = await client.getGuild(channel.guild);

        const newChannel = await new Channel({
            _id: new mongoose.Types.ObjectId(),
            channelID: channel.id,
            channelName: channel.name,
            guildID: guildObject._id
        });

        newChannel.save()
            .then(() => {
                Guild.findOneAndUpdate({ guildID: channel.guild.id }, {
                    $addToSet: { channels: newChannel._id }
                }).catch((err) => {
                    console.error("Error linking channel to guild in database: ", err);
                });
            }).catch((err) => {
                console.error("Error adding channel to database: ", err);
            });

        return;
    };

    client.getMessage = async (message) => {
        return Message.findOne({ messageID: message.id })
            .then((message, err) => {
                if (err) console.error(err);

                if (message) return message.toObject();
                else return null;
            });
    }

    client.updateMessage = async (message, newMessage, settings) => {
        // The message was edited (check to make sure it wasn't just an embed being added onto the message)
        if (newMessage && message.content != newMessage.content) {
            await Message.findOneAndUpdate({ messageID: message.id }, {
                $push: { editedText: newMessage.content }
            }).catch((err) => {
                console.error("Error updating edited message in database: ", err);
            });
            
            return;
        }

        // Change message attributes (deleted)
        let data = await client.getMessage(message);
        // We didn't save the original message
        if (!data) return;

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else return;
        }

        await Message.findOneAndUpdate({ messageID: message.id }, data)
            .catch((err) => {
                console.error("Error updating message in database: ", err);
            });
        return;
    }

    client.createMessage = async (message, settings) => {
        let guildObject = await client.getGuild(message.guild);
        let channelObject = await client.getChannel(message.channel);

        if (!guildObject || !channelObject) return;

        let command;
        if (message.content.startsWith(settings.prefix)) {
            let commandString = message.content.split(" ")[0].slice(settings.prefix.length).toLowerCase();
            if (commandString.length === 0) command = "";
            else {
                let commandFunction = client.commands.get(commandString);
                if (!commandFunction) commandFunction = client.commands.get(client.aliases.get(commandString));

                if (commandFunction) command = commandString;
                else command = "";
            }
        } else {
            command = "";
        }

        const newMessage = await new Message({
            _id: new mongoose.Types.ObjectId(),
            text: message.content,
            command: command,
            userID: message.author.id,
            username: message.author.username,
            guildID: guildObject._id,
            channelID: channelObject._id,
            messageID: message.id,
        });

        await newMessage.save().catch((err) => {
            console.error("Error saving message to database: ", err);
        });
        await Channel.findOneAndUpdate({ guildID: guildObject._id }, {
            $push: { messages: newMessage._id }
        }).catch((err) => {
            console.error("Error linking message to channel in database: ", err);
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
            username: user.username,
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