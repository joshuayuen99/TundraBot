/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TundraBot } from "../../base/TundraBot";
import { DASHBOARD_OWNER_FULL_ACCESS } from "../../config";
import Deps from "../../utils/deps";
import Logger from "../../utils/logger";
import Sessions from "./sessions";

export default class Middleware {
    async updateUser(req, res, next) {
        try {
            const key = res.cookies.get("key");
            if (key) {
                const { authUser } = await req.app.get("sessions").get(key);
                res.locals.user = authUser;
            }
        } finally {
            next();
        }
    }

    async validateUser(req, res, next) {
        res.locals.user
            ? next()
            : res.render("errors/401", { message: "Unauthorized access! You must be logged in."} );
    }

    async updateGuilds(req, res, next) {
        try {
            const key = res.cookies.get("key");
            if (key) {
                const { authUser, authGuilds } = await req.app.get("sessions").get(key);
                Logger.log("debug", "CHECKING");
                if (DASHBOARD_OWNER_FULL_ACCESS && authUser.id === process.env.OWNERID) {
                    // owner has access to everything
                    Logger.log("debug", "HERE");


                    res.locals.guilds = [...req.app.get("client").guilds.cache.values()]
                        .sort((a, b) => {
                            if (a.name.toLowerCase() < b.name.toLowerCase())
                                return -1;
                            else if (
                                a.name.toLowerCase() > b.name.toLowerCase()
                            )
                                return 1;
                            return 0;
                        });
                    for (const [guildID, guild] of req.app.get("client").guilds.cache) {
                        await guild.members.fetch(guild.ownerID);
                    }
                    return;
                }

                res.locals.guilds = authGuilds.sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                    else if (a.name.toLowerCase() > b.name.toLowerCase())
                        return 1;
                    return 0;
                });
                for (const guild of authGuilds) {
                    await guild.members.fetch(guild.ownerID);
                }
            }
        } finally {
            next();
        }
    }

    async validateGuild(req, res, next) {
        res.locals.guild = res.locals.guilds.find(
            (g) => g.id === req.params.id
        );
        return res.locals.guild ? next() : res.render("errors/404");
    }
}
