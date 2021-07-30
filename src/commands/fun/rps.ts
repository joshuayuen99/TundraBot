import { Command, CommandContext } from "../../base/Command";
import { promptMessage, sendMessage } from "../../utils/functions";
import { MessageEmbed, PermissionString } from "discord.js";
import Logger from "../../utils/logger";

const ROCK = "⛰️";
const PAPER = "📰";
const SCISSORS = "✂️";
const emojiArray = [ROCK, PAPER, SCISSORS];
const DISAPPOINTED = "😞";

export default class Rps implements Command {
    name = "rps";
    category = "fun";
    description =
        "Rock paper scissors game. React to one of the emojis to play!";
    usage = "rps";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["ADD_REACTIONS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setColor("#ffffff")
            .setTitle("Rock Paper Scissors!")
            .setFooter(
                ctx.member?.displayName || ctx.author.username,
                ctx.author.displayAvatarURL()
            )
            .setDescription("React to one of these emojis to play the game!")
            .setTimestamp();

        const msg = await sendMessage(ctx.client, embedMsg, ctx.channel);
        if (!msg) return;

        const reacted = await promptMessage(
            ctx.client,
            msg,
            ctx.author,
            30,
            emojiArray
        );
        // If they didn't respond back in time
        if (!reacted) {
            msg.reactions.removeAll();
            msg.edit(`Guess I win by default ${DISAPPOINTED}`);
            return;
        }

        const botChoice =
            emojiArray[Math.floor(Math.random() * emojiArray.length)];

        const result = await this.getResult(reacted, botChoice);
        await msg.reactions.removeAll().catch((err) => {
            Logger.log("error", `Failed to remove reactions:\n${err}`);
        });

        embedMsg
            .setDescription("")
            .addField(result, `${reacted} vs ${botChoice}`);

        msg.edit(embedMsg);
        return;
    }

    getResult(me: string, botChosen: string): string {
        // User wins
        if (
            (me === ROCK && botChosen === SCISSORS) ||
            (me === PAPER && botChosen === ROCK) ||
            (me === SCISSORS && botChosen === PAPER)
        ) {
            return "You won!";
        } else if (me === botChosen) {
            return "It's a tie!";
        } else {
            return "You lost!";
        }
    }
}