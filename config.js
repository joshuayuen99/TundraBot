module.exports = {
    owner: process.env.OWNERID,
    prefix: process.env.COMMAND_PREFIX,
    defaultGuildSettings: {
        prefix: process.env.COMMAND_PREFIX,
        welcomeChannel: "welcome",
        welcomeMessage: "Welcome **{{user}}** to **{{guild}}**!",
        soundboardRole: "Soundboard DJ",
        modRole: "Moderator",
        adminRole: "Administrator",
        logChannel: "tundra-logs"
    }
}