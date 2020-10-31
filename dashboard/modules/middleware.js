const { client } = require("../..");
const authClient = require("./auth-client");
const sessions = require("./sessions");

module.exports = {
    updateUser: async (req, res, next) => {
        try {
            const key = res.cookies.get("key");
            if (key) {
                const { authUser } = await sessions.get(key);
                res.locals.user = authUser;
            }
        } finally {
            next();
        }
    },

    validateUser: async (req, res, next) => {
        res.locals.user ? next() : res.render("errors/401", { message: "Unauthorized access! You must be logged in."});
    },

    updateGuilds: async (req, res, next) => {
        try {
            const key = res.cookies.get("key");
            if (key) {
                const { authUser, authGuilds } = await sessions.get(key);
                if (authUser.id === process.env.OWNERID) { // owner has access to everything
                    res.locals.guilds = client.guilds.cache.array().sort((a, b) => {
                        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                        else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                        return 0;                    });
                    for (const [guildID, guild] of client.guilds.cache) {
                        guild.members.fetch(guild.ownerID);
                    }
                    return;
                }

                res.locals.guilds = authGuilds.sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                    else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                    return 0;
                });
                for (const guild of authGuilds) {
                    guild.members.fetch(guild.ownerID);
                }
            }
        } finally {
            next();
        }
    },

    validateGuild: async (req, res, next) => {
        res.locals.guild = res.locals.guilds.find(g => g.id === req.params.id);
        return (res.locals.guild) ? next() : res.render("errors/404");
    }
};