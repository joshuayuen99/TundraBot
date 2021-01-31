const { Guild, User, Member, Channel, Message, Event, Poll, RoleMenu, SoundEffect, Reminder } = require("../models");

const { cacheInvites } = require("../helpers/cacheInvites");

module.exports = (client) => {
    client.getGuild = async (guild) => {
        // Check cache first
        if (client.databaseCache.settings.has(guild.id)) return client.databaseCache.settings.get(guild.id);

        const data = await Guild.findOne({ guildID: guild.id })
            .then((guild, err) => {
                if (err) console.error(err);

                if (guild) return guild.toObject();
                else return client.config.defaultGuildSettings;
            });

        client.databaseCache.settings.set(guild.id, data);

        return data;
    };

    client.updateGuild = async (guild, settings) => {
        let data = await client.getGuild(guild);

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        return Guild.findOneAndUpdate({ guildID: guild.id }, data, { new: true })
        .then((newData) => {
            console.log(`Guild "${newData.guildName}" updated settings: ${Object.keys(settings)}`);

            // Update cache
            client.databaseCache.settings.set(guild.id, newData.toObject());

            if (newData.joinMessages.inviteTracker) cacheInvites(client, guild);
            return newData;
        }).catch((err) => {
                console.error("Error updating guild in database: ", err);
            });
    };

    client.createGuild = async (settings) => {
        let defaults = Object.assign(client.config.defaultGuildSettings);
        let merged = Object.assign(defaults, settings);

        const newGuild = await new Guild(merged);
        await newGuild.save()
            .then(() => {
                console.log(`Default settings saved for guild "${merged.guildName}" (${merged.guildID})`);
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
            else continue;
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
    };

    client.updateMessage = async (message, newMessage, settings) => {
        // The message was edited (check to make sure it wasn't just an embed being added onto the message)
        if (newMessage && message.content != newMessage.content) {
            return await Message.findOneAndUpdate({ messageID: message.id }, {
                $push: { editedText: newMessage.content }
            }).catch((err) => {
                console.error("Error updating edited message in database: ", err);
            });
        }

        // Change message attributes (deleted)
        let data = await client.getMessage(message);
        // We didn't save the original message
        if (!data) return;

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        await Message.findOneAndUpdate({ messageID: message.id }, data)
            .catch((err) => {
                console.error("Error updating message in database: ", err);
            });
        return data;
    };

    client.createMessage = async (message, settings) => {
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
            messageID: message.id,
            text: message.content,
            command: command,
            userID: message.author.id,
            username: message.author.username,
            guildID: message.guild.id,
            channelID: message.channel.id
        });

        await newMessage.save().catch((err) => {
            console.error("Error saving message to database: ", err);
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

    client.updateUser = async (user, settings) => {
        let data = await client.getUser(user)
        data = data.settings;

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        return await User.findOneAndUpdate({ userID: user.id }, {
            settings: data,
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
    };

    client.createUser = async (user) => {
        const newUser = await new User({
            userID: user.id,
            username: user.username,
        });

        return await newUser.save().catch((err) => {
            console.error("Error creating new user in database: ", err);
        });
    };

    client.updateMember = async (member, settings) => {
        let data = await client.getMember(member)
        data = data.settings;

        if (typeof data !== "object") data = {};
        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        return await Member.findOneAndUpdate({
            userID: member.user.id,
            guildID: member.guild.id
        }, {
            settings: data,
        }).catch((err) => {
            console.error("Error updating user settings in database: ", err);
        });
    };

    client.getMember = async (member) => {
        return Member.findOne({
            userID: member.user.id,
            guildID: member.guild.id
        }).then((member, err) => {
                if (err) console.error(err);

                if (member) return member.toObject();
                else return null;
            });
    };



    client.createMember = async (member) => {
        const newMember = await new Member({
            userID: member.user.id,
            guildID: member.guild.id,
            username: member.user.username
        });

        return await newMember.save().catch((err) => {
            console.error("Error creating new member in database: ", err);
        });
    };

    client.getEvent = async (messageID) => {
        return Event.findOne({ messageID: messageID })
            .then((event, err) => {
                if (err) console.error(err);

                if (event) return event.toObject();
                else return null;
            });
    };
    
    client.updateEvent = async (messageID, participantObject) => {
        // we want to add new participants
        if (participantObject.add) {
            return await Event.findOneAndUpdate({ messageID: messageID }, {
                        $addToSet: { participants: participantObject.participant }
                    }).catch((err) => {
                        console.error(`Error adding participant to event (messageID: ${event.messageID}) in database: `, err);
                    });
        } else { // we want to remove old participants
            return await Event.findOneAndUpdate({ messageID: messageID }, {
                $pull: { participants: participantObject.participant }
            }).catch((err) => {
                console.error(`Error removing participant from event (messageID: ${event.messageID}) in database: `, err);
            });
        }
    };

    client.createEvent = async (event) => {
        const newEvent = await new Event(event);

        return await newEvent.save().catch((err) => {
            console.error("Error creating new event in database: ", err);
        });
    };

    client.createPoll = async (poll) => {
        const newPoll = await new Poll(poll);

        return await newPoll.save().catch((err) => {
            console.error("Error creating new poll in database: ", err);
        });
    };

    client.createRoleMenu = async (roleMenu) => {
        const newRoleMenu = await new RoleMenu(roleMenu);

        return await newRoleMenu.save().catch((err) => {
            console.error("Error creating new role menu in database: ", err);
        })
    };

    client.updateRoleMenu = async (messageID, roleMenu) => {
        return await RoleMenu.findOneAndUpdate({ messageID: messageID }, roleMenu).catch((err) => {
            console.error(`Error updating role menu (messageID: ${roleMenu.messageID}) in database: `, err);
        });
    };

    client.createSoundEffect = async (soundEffect) => {
        const newSoundEffect = await new SoundEffect(soundEffect);

        return await newSoundEffect.save().catch((err) => {
            console.error("Error creating new sound effect in database: ", err);
        })
    };

    client.getReminders = async (userID) => {
        return await Reminder.find({ userID : userID }).catch((err) => {
            console.error("Error getting reminder from database: ", err);
        });
    };

    client.createReminder = async (reminder) => {
        const newReminder = await new Reminder(reminder);

        return await newReminder.save().catch((err) => {
            console.error("Error creating new reminder in database: ", err);
        });
    };

    client.deleteReminder = async (reminder) => {
        return reminder.delete().catch((err) => {
            console.error("Error deleting reminder from database: ", err);
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