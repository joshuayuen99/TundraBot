module.exports = {
    owner: process.env.OWNERID,
    prefix: process.env.COMMAND_PREFIX,
    defaultGuildSettings: {
        prefix: process.env.COMMAND_PREFIX,
        welcomeMessage: {
            enabled: false,
            welcomeMessage: "Welcome **{{member}}** to **{{server}}**!",
            channelID: null
        },
        soundboardRole: "Soundboard DJ",
        modRole: "Moderator",
        adminRole: "Administrator",
        logChannel: "tundra-logs"
    }
}