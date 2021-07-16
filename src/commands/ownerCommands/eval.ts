import { Command, CommandContext } from "../../base/Command";
import { sendMessage } from "../../utils/functions";

import { MessageEmbed } from "discord.js";
import moment from "moment";
import ms from "ms";
import { TundraBot } from "../../base/TundraBot";

import * as utils from "util";

export default class Eval implements Command {
    name = "eval";
    category = "ownerCommands";
    description = "Evaluate Javascript commands.";
    usage = "eval <Javascript>";
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 0; // 0 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (ctx.author.id !== process.env.OWNERID) return;

        const code = args.join(" ");

        const startTime = moment();
        
        try {
            let evaled = await eval(code);

            const endTime = moment();

            const resultType = typeof evaled;

            if (typeof evaled !== "string") evaled = utils.inspect(evaled);

            const clean = await this.clean(ctx.client, evaled);

            const description = `Input:\n\`\`\`js\n${code}\`\`\`\nOutput:\n\`\`\`js\n${clean}\`\`\`\nType: \`${resultType}\` | Took: \`${ms(endTime.diff(startTime))}\``;

            // Exceeds max embed message description length
            if (description.length > 2048) {
                ctx.channel.send("Output exceeded 2048 characters. Exported to the attached file.", {
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
                    .setTimestamp(endTime.toDate());

                sendMessage(ctx.client, embedMsg, ctx.channel);
                return;
            }
        } catch (err) {
            const endTime = moment();

            const resultType = err.constructor.name;

            const clean = await this.clean(ctx.client, err);

            const description = `Input:\n\`\`\`js\n${code}\`\`\`\nOutput:\n\`\`\`js\n${clean}\`\`\`\nType: \`${resultType}\` | Took: \`${ms(endTime.diff(startTime))}\``;

            // Exceeds max embed message description length
            if (description.length > 2048) {
                ctx.channel.send("Output exceeded 2048 characters. Exported to the attached file.", {
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
                    .setTimestamp(endTime.toDate());

                sendMessage(ctx.client, embedMsg, ctx.channel);
                return;
            }
        }
    }

    async clean(client: TundraBot, text: string): Promise<string> {
        if (typeof (text) === "string") {
            text = text
                .replace(/`/g, "`" + String.fromCharCode(8203))
                .replace(/@/g, "@" + String.fromCharCode(8203))
                .replace(client.token, "YEET")
                .replace(process.env.DISCORDTOKEN, "YEET")
                .replace(process.env.YOUTUBEKEY, "YEET")
                .replace(process.env.MONGOOSE_URL, "YEET")
                .replace(process.env.MONGOOSE_USERNAME, "YEET")
                .replace(process.env.MONGOOSE_PASSWORD, "YEET");

            return text;
        } else {
            return text;
        }
    }
}