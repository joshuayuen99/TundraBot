const express = require("express");
const moment = require("moment");
const { Message } = require("../../models");
const { validateGuild } = require("../modules/middleware");
const { client } = require("../../index");
require("../../utils/mongooseFunctions")(client);

const router = express.Router();

router.get("/dashboard", (req, res) => {
    res.render("dashboard/index");
});

router.get("/servers/:id", validateGuild, async (req, res) => {
    async function getInfo() {
        const guild = client.getGuild({ id: req.params.id });
        const hourlyMessages = Message.aggregate([
            {
                '$match': {
                    guildID: req.params.id,
                    'createdAt': {
                    '$gte': moment(Date.now()).subtract(7, "days").toDate()
                    }
                }
            },
            { "$project": {
                "y": { "$year": "$createdAt" },
                "m": { "$month": "$createdAt" },
                "d": { "$dayOfMonth": "$createdAt" },
                "h": { "$hour": "$createdAt" }}
            },
            { "$group": { 
                  "_id": { "year": "$y", "month": "$m", "day": "$d", "hour": "$h" },
                  "count": { "$sum": 1 }
            }
        }]);
        const commandCounts = Message.aggregate([
            {
              '$match': {
                'guildID': req.params.id,
                'command': {
                  '$ne': ''
                }
              }
            }, {
              '$group': {
                '_id': '$command', 
                'count': {
                  '$sum': 1
                }
              }
            }
          ]);
        const messageCounts = Message.aggregate([
            {
                '$match': {
                    guildID: req.params.id,
                    'createdAt': {
                    '$gte': moment(Date.now()).subtract(14, "days").toDate()
                    }
                }
            }, {
              '$group': {
                '_id': {
                  '$dayOfWeek': '$updatedAt'
                }, 
                'count': {
                  '$sum': 1
                }
              }
            }, {
              '$sort': {
                '_id': 1
              }
            }
          ]);

          const info = {
              guild: await guild,
              hourlyMessages: await hourlyMessages,
              commandCounts: await commandCounts,
              messageCounts: await messageCounts
            };
          return info;
    };

    const data = await getInfo();

    res.render("dashboard/show", {
        savedGuild: data.guild,
        hourlyMessages: data.hourlyMessages,
        commandCounts: data.commandCounts,
        messageCounts: data.messageCounts
    });
});

router.put("/servers/:id/:module", validateGuild, async (req, res) => {
    try {
        const { id, module } = req.params;

        if (module == "general") {
            let settings = {};
            
            // Prefix
            settings.prefix = req.body.prefix;
            
            // Blacklisted channels
            if (req.body.blacklistedChannelIDs) {
                settings.blacklistedChannelIDs = req.body.blacklistedChannelIDs;
            } else {
                settings.blacklistedChannelIDs = [];
            }

            // Log channel
            settings.logMessages = {};
            if (req.body.logMessagesEnabled) {
                settings.logMessages.enabled = true;
                settings.logMessages.channelID = req.body.logMessagesChannel;
            } else {
                settings.logMessages.enabled = false;
            }

            // Welcome message
            settings.welcomeMessage = {};
            if (req.body.welcomeMessageEnabled == "on") {
                settings.welcomeMessage.enabled = true;
                settings.welcomeMessage.welcomeMessage = req.body.welcomeMessage;
                settings.welcomeMessage.channelID = req.body.welcomeMessageChannel;
            } else {
                settings.welcomeMessage.enabled = false;
            }

            // Join messages
            settings.joinMessages = {};
            if (req.body.joinMessagesEnabled == "on") {
                settings.joinMessages.enabled = true;
                settings.joinMessages.channelID = req.body.joinMessagesChannel;
                settings.joinMessages.trackInvites = true;
            } else {
                settings.joinMessages.enabled = false;
                settings.joinMessages.trackInvites = true;
            }

            // Leave messages
            settings.leaveMessages = {};
            if (req.body.joinMessagesEnabled == "on") {
                settings.leaveMessages.enabled = true;
                settings.leaveMessages.channelID = req.body.leaveMessagesChannel;
            } else {
                settings.leaveMessages.enabled = false;
            }

            await client.updateGuild({ id: id }, settings)
        }

        res.redirect(`/servers/${id}`);
    } catch (err) {
        res.render("errors/400");
        console.error(err);
    }
});

module.exports = router;