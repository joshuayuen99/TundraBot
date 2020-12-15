const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "remind",
    aliases: ["reminder", "remindme"],
    category: "utility",
    description: "Schedule a reminder to be DM'd to you after a certain amount of time.",
    usage: stripIndents`remind <timer> <reminder>
    eg. remind 2h Game night`,
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (!args[0] || !args[1]) {
            message.reply(`Usage: \`${module.exports.usage}\``);
            return;
        }

        if (isNaN(ms(args[0]))) {
            message.reply("I couldn't recognize that duration. Cancelling reminder.");
            return;
        }

        const startTime = message.createdAt.getTime();
        const endTime = startTime + ms(args[0]);

        // User entered a negative time
        if (endTime <= startTime) {
            message.reply("I can't send you a reminder in the past!");
            return;
        }

        const reminder = args.splice(1).join(" ");

        const embedMsg = new MessageEmbed()
            .setColor("YELLOW")
            .setFooter("Reminder set for")
            .setTimestamp(endTime)
            .setThumbnail(message.author.avatarURL())
            .setTitle("Reminder set")
            .setDescription(reminder);

        message.channel.send(embedMsg);

        const reminderObject = {
            userID: message.author.id,
            reminder: reminder,
            startTime: startTime,
            endTime: endTime
        };

        await client.createReminder(reminderObject).then((reminderObject) => {
            setTimeout(() => {
                module.exports.remind(client, reminderObject);
            }, endTime - startTime);
        }).catch((err) => {

        });
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {Document} reminder reminder object
    */
    remind: async (client, reminder) => {
        const user = client.users.cache.get(reminder.userID);

        const remindEmbed = new MessageEmbed()
            .setColor("YELLOW")
            .setTitle("Reminder")
            .setDescription(reminder.reminder)
            .setTimestamp(reminder.endTime);

        user.send(remindEmbed);

        client.deleteReminder(reminder);
    }
};