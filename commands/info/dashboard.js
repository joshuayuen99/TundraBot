const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "dashboard",
    aliases: ["db"],
    category: "info",
    description: "Gives a link to the dashboard.",
    usage: "dashboard",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const embedMsg = new MessageEmbed()
            .setTitle("Dashboard")
            .setDescription(`Visit my dashboard [here!](${process.env.DASHBOARD_URL})`)
            .setColor("#0b7ed6");

        message.channel.send(embedMsg);
    }
};