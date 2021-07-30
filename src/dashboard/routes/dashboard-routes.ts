/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Router } from "express";
import moment from "moment";
import { TundraBot } from "../../base/TundraBot";
import Deps from "../../utils/deps";
import Middleware from "../modules/middleware";
import { Route } from "./Route";

import { messageModel } from "../../models/Message";
import { DBGuild, guildInterface, guildModel } from "../../models/Guild";
import Logger from "../../utils/logger";

// const { Rule } = require("../../automod/models");
// const Triggers = require("../../automod/triggers");
// const Effects = require("../../automod/effects");
// const { Ruleset } = require("../../automod/models");

export default class DashboardRoutes extends Route {
    router: Router;
    middleware: Middleware;
    DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);

        this.router = express.Router();
        this.middleware = Deps.get<Middleware>(Middleware);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);

        this.router.get("/dashboard", (req, res) => {
            res.render("dashboard/index");
        });

        this.router.get(
            "/servers/:id/:module",
            this.middleware.validateGuild,
            async (req, res) => {
                // async function getInfo() {
                //     const guild = guildModel.findOne({ id: req.params.id });
                //     // const rules = Rule.find({ guildID: req.params.id });
                //     const hourlyMessages = messageModel.aggregate([
                //         {
                //             $match: {
                //                 guildID: req.params.id,
                //                 createdAt: {
                //                     $gte: moment(Date.now())
                //                         .subtract(7, "days")
                //                         .toDate(),
                //                 },
                //             },
                //         },
                //         {
                //             $project: {
                //                 y: { $year: "$createdAt" },
                //                 m: { $month: "$createdAt" },
                //                 d: { $dayOfMonth: "$createdAt" },
                //                 h: { $hour: "$createdAt" },
                //             },
                //         },
                //         {
                //             $group: {
                //                 _id: {
                //                     year: "$y",
                //                     month: "$m",
                //                     day: "$d",
                //                     hour: "$h",
                //                 },
                //                 count: { $sum: 1 },
                //             },
                //         },
                //     ]);
                //     const commandCounts = messageModel.aggregate([
                //         {
                //             $match: {
                //                 guildID: req.params.id,
                //                 command: {
                //                     $ne: "",
                //                 },
                //             },
                //         },
                //         {
                //             $group: {
                //                 _id: "$command",
                //                 count: {
                //                     $sum: 1,
                //                 },
                //             },
                //         },
                //     ]);
                //     const messageCounts = messageModel.aggregate([
                //         {
                //             $match: {
                //                 guildID: req.params.id,
                //                 createdAt: {
                //                     $gte: moment(Date.now())
                //                         .subtract(14, "days")
                //                         .toDate(),
                //                 },
                //             },
                //         },
                //         {
                //             $group: {
                //                 _id: {
                //                     $dayOfWeek: "$updatedAt",
                //                 },
                //                 count: {
                //                     $sum: 1,
                //                 },
                //             },
                //         },
                //         {
                //             $sort: {
                //                 _id: 1,
                //             },
                //         },
                //     ]);

                //     const info = {
                //         guild: await guild,
                //         // rules: await rules,
                //         hourlyMessages: await hourlyMessages,
                //         commandCounts: await commandCounts,
                //         messageCounts: await messageCounts,
                //     };
                //     return info;
                // }

                // const data = await getInfo();

                const [guild, hourlyMessages, commandCounts, messageCounts] =
                    await Promise.all([
                        (() => {
                            return guildModel.findOne({
                                guildID: req.params.id,
                            });
                        })(),
                        (() => {
                            return messageModel.aggregate([
                                {
                                    $match: {
                                        guildID: req.params.id,
                                        createdAt: {
                                            $gte: moment(Date.now())
                                                .subtract(7, "days")
                                                .toDate(),
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        y: { $year: "$createdAt" },
                                        m: { $month: "$createdAt" },
                                        d: { $dayOfMonth: "$createdAt" },
                                        h: { $hour: "$createdAt" },
                                    },
                                },
                                {
                                    $group: {
                                        _id: {
                                            year: "$y",
                                            month: "$m",
                                            day: "$d",
                                            hour: "$h",
                                        },
                                        count: { $sum: 1 },
                                    },
                                },
                            ]);
                        })(),
                        (() => {
                            return messageModel.aggregate([
                                {
                                    $match: {
                                        guildID: req.params.id,
                                        command: {
                                            $ne: "",
                                        },
                                    },
                                },
                                {
                                    $group: {
                                        _id: "$command",
                                        count: {
                                            $sum: 1,
                                        },
                                    },
                                },
                            ]);
                        })(),
                        (() => {
                            return messageModel.aggregate([
                                {
                                    $match: {
                                        guildID: req.params.id,
                                    },
                                },
                                {
                                    $group: {
                                        _id: {
                                            $dayOfWeek: "$updatedAt",
                                        },
                                        count: {
                                            $sum: 1,
                                        },
                                    },
                                },
                                {
                                    $sort: {
                                        _id: 1,
                                    },
                                },
                            ]);
                        })(),
                    ]);

                const data = {
                    guild: guild,
                    // rules: await rules,
                    hourlyMessages: hourlyMessages,
                    commandCounts: commandCounts,
                    messageCounts: messageCounts,
                };

                // Available triggers, conditions, and effects for rules
                // const availableTriggers = ["SlowmodeTrigger"];
                // let availableTriggersObject = [];
                // for (const trigger of availableTriggers) {
                //     availableTriggersObject.push(Triggers[trigger]);
                // }

                // const availableConditions = [];
                // const availableEffects = [];

                res.render("dashboard/show", {
                    module: req.params.module || "overview",
                    savedGuild: data.guild,
                    // availableTriggers: availableTriggersObject,
                    // rules: data.rules,
                    hourlyMessages: data.hourlyMessages,
                    commandCounts: data.commandCounts,
                    messageCounts: data.messageCounts,
                });
            }
        );

        this.router.put(
            "/servers/:id/:module/save",
            this.middleware.validateGuild,
            async (req, res) => {
                try {
                    const { id, module } = req.params;

                    // if (module == "automod") {
                    //     const settings = {};
                    // }

                    if (module == "general") {
                        const settings = {} as Partial<guildInterface>;

                        // Prefix
                        settings.prefix = req.body.prefix;

                        // Blacklisted channels
                        if (req.body.blacklistedChannelIDs) {
                            settings.blacklistedChannelIDs =
                                req.body.blacklistedChannelIDs;
                        } else {
                            settings.blacklistedChannelIDs = [];
                        }

                        // Log channel
                        settings.logMessages = {} as any;
                        if (req.body.logMessagesEnabled) {
                            settings.logMessages.enabled = true;
                            settings.logMessages.channelID =
                                req.body.logMessagesChannel;
                        } else {
                            settings.logMessages.enabled = false;
                        }

                        // Welcome message
                        settings.welcomeMessage = {} as any;
                        if (req.body.welcomeMessageEnabled == "on") {
                            settings.welcomeMessage.enabled = true;
                            settings.welcomeMessage.welcomeMessage =
                                req.body.welcomeMessage;
                            settings.welcomeMessage.channelID =
                                req.body.welcomeMessageChannel;
                        } else {
                            settings.welcomeMessage.enabled = false;
                        }

                        // Join messages
                        settings.joinMessages = {} as any;
                        if (req.body.joinMessagesEnabled == "on") {
                            settings.joinMessages.enabled = true;
                            settings.joinMessages.channelID =
                                req.body.joinMessagesChannel;
                        } else {
                            settings.joinMessages.enabled = false;
                        }
                        if (req.body.joinMessagesTrackInvites == "on") {
                            settings.joinMessages.trackInvites = true;
                        } else {
                            settings.joinMessages.trackInvites = false;
                        }

                        // Leave messages
                        settings.leaveMessages = {} as any;
                        if (req.body.joinMessagesEnabled == "on") {
                            settings.leaveMessages.enabled = true;
                            settings.leaveMessages.channelID =
                                req.body.leaveMessagesChannel;
                        } else {
                            settings.leaveMessages.enabled = false;
                        }

                        const guild = await req.app
                            .get("client")
                            .guilds.fetch(id);
                        await this.DBGuildManager.update(guild, settings);
                    }

                    res.redirect(`/servers/${id}/${module}`);
                } catch (err) {
                    res.render("errors/400");
                    Logger.log("error", `Error saving settings from dashboard (guildID: ${req.params.id}):\n${err}`);
                }
            }
        );

        // this.router.put(
        //     "/servers/:id/automod/createRuleset",
        //     this.middleware.validateGuild,
        //     async (req, res) => {
        //         try {
        //             const { id } = req.params;

        //             const newRuleset = await new Ruleset({
        //                 guildID: id,
        //                 name: req.body.newRulesetName,
        //             });

        //             newRuleset.save().then(() => {
        //                 console.log(`Created new ruleset: ${newRuleset.name}`);
        //             });

        //             res.status(204).send();
        //         } catch (err) {
        //             res.render("errors/400");
        //             console.error(err);
        //         }
        //     }
        // );
    }
}
