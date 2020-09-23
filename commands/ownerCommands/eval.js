module.exports = {
    name: "eval",
    category: "ownerCommands",
    description: "Evaluate Javascript commands.",
    usage: "eval <Javascript>",
    run: async (client, message, args, settings) => {
        if (message.author.id !== client.config.owner) return;

        try {
            const code = args.join(" ");
            let evaled = eval(code);

            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

            const clean = await client.clean(client, evaled);
            // 6 graves, 2 characters for "js"
            const messageLength = 3 + clean.length + 2 + 3;
            if (messageLength > 2000) {
                return message.channel.send("Output exceeded 2000 characters. Exported to the attached file", {
                    files: [{
                        attachment: Buffer.from(clean),
                        name: "output.txt"
                    }]
                });
            }

            return message.channel.send(clean, { code: "js" });
        } catch (err) {
            message.channel.send(`ERROR\n\n${await client.clean(client, err)}\n`, { code: "bash" });
        }
    }
};