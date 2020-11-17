const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const ms = require("ms");

module.exports = {
    name: "eval",
    category: "ownerCommands",
    description: "Evaluate Javascript commands.",
    usage: "eval <Javascript>",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (message.author.id !== process.env.OWNERID) return;

        const code = args.join(" ");

        const startTime = moment();
        
        try {
            let evaled = await eval(code);

            const endTime = moment();

            const resultType = typeof evaled;

            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

            const clean = await client.clean(client, evaled);

            const description = `Input:\n\`\`\`js\n${code}\`\`\`\nOutput:\n\`\`\`js\n${clean}\`\`\`\nType: \`${resultType}\` | Took: \`${ms(endTime - startTime)}\``;

            // Exceeds max embed message description length
            if (description.length > 2048) {
                message.channel.send("Output exceeded 2048 characters. Exported to the attached file.", {
                    files: [{
                        attachment: Buffer.from(description),
                        name: "output.txt"
                    }]
                });
                return;
            } else {
                const embedMsg = new MessageEmbed()
                    .setColor("GREEN")
                    .setTitle("Eval Success!")
                    .setDescription(description)
                    .setTimestamp(endTime);

                message.channel.send(embedMsg);
                return;
            }
        } catch (err) {
            const endTime = moment();

            const resultType = err.constructor.name;

            const clean = await client.clean(client, err);

            const description = `Input:\n\`\`\`js\n${code}\`\`\`\nOutput:\n\`\`\`js\n${clean}\`\`\`\nType: \`${resultType}\` | Took: \`${ms(endTime - startTime)}\``;

            // Exceeds max embed message description length
            if (description.length > 2048) {
                message.channel.send("Output exceeded 2048 characters. Exported to the attached file.", {
                    files: [{
                        attachment: Buffer.from(description),
                        name: "output.txt"
                    }]
                });
                return;
            } else {
                const embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Eval Error!")
                    .setDescription(description)
                    .setTimestamp(endTime);

                message.channel.send(embedMsg);
                return;
            }
        }
    }
};