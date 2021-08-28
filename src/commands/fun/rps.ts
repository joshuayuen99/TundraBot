import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { sendReply } from "../../utils/functions";
import {
    ButtonInteraction,
    CollectorFilter,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
} from "discord.js";

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
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.ADD_REACTIONS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Rock paper scissors game";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setColor("#ffffff")
            .setTitle("Rock Paper Scissors!")
            .setFooter(
                ctx.member?.displayName || ctx.author.username,
                ctx.author.displayAvatarURL()
            )
            .setDescription(
                "Click one of the buttons below to make your choice!"
            )
            .setTimestamp();

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(ROCK)
                .setLabel("Rock")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId(PAPER)
                .setLabel("Paper")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId(SCISSORS)
                .setLabel("Scissors")
                .setStyle("SECONDARY")
        );

        const gameMessage = await sendReply(
            ctx.client,
            {
                embeds: [embedMsg],
                components: [row],
            },
            ctx.msg
        );
        if (!gameMessage) return;

        const filter: CollectorFilter<[ButtonInteraction]> = (i) => {
            const intendedUser = i.user.id === ctx.author.id;
            if (!intendedUser) {
                i.reply({
                    content: "These buttons aren't for you!",
                    ephemeral: true,
                });
            }

            return intendedUser;
        };

        let choice: ButtonInteraction;
        try {
            choice = await gameMessage.awaitMessageComponent({
                filter,
                componentType: "BUTTON",
                time: 30 * 1000,
            });
        } catch (err) {
            // No button was clicked
            embedMsg.setDescription(`Guess I win by default ${DISAPPOINTED}`);

            gameMessage.edit({
                embeds: [embedMsg],
                components: [],
            });
            return;
        }

        const botChoice =
            emojiArray[Math.floor(Math.random() * emojiArray.length)];
        const result = this.getResult(choice.customId, botChoice);

        embedMsg
            .setDescription("")
            .addField(result, `${choice.customId} vs ${botChoice}`);

        gameMessage.edit({
            embeds: [embedMsg],
            components: [],
        });

        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        await ctx.commandInteraction.deferReply();

        const embedMsg = new MessageEmbed()
            .setColor("#ffffff")
            .setTitle("Rock Paper Scissors!")
            .setFooter(
                ctx.member?.displayName || ctx.author.username,
                ctx.author.displayAvatarURL()
            )
            .setDescription(
                "Click one of the buttons below to make your choice!"
            )
            .setTimestamp();

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(ROCK)
                .setLabel("Rock")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId(PAPER)
                .setLabel("Paper")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId(SCISSORS)
                .setLabel("Scissors")
                .setStyle("SECONDARY")
        );

        const gameMessage = (await ctx.commandInteraction.editReply({
            embeds: [embedMsg],
            components: [row],
        })) as Message;

        const filter: CollectorFilter<[ButtonInteraction]> = (i) => {
            const intendedUser = i.user.id === ctx.author.id;
            if (!intendedUser) {
                i.reply({
                    content: "These buttons aren't for you!",
                    ephemeral: true,
                });
            }

            return intendedUser;
        };

        let choice: ButtonInteraction;
        try {
            choice = await gameMessage.awaitMessageComponent({
                filter,
                componentType: "BUTTON",
                time: 30 * 1000,
            });
        } catch (err) {
            // No button was clicked
            embedMsg.setDescription(`Guess I win by default ${DISAPPOINTED}`);

            ctx.commandInteraction.editReply({
                embeds: [embedMsg],
                components: [],
            });
            return;
        }

        const botChoice =
            emojiArray[Math.floor(Math.random() * emojiArray.length)];
        const result = this.getResult(choice.customId, botChoice);

        embedMsg
            .setDescription("")
            .addField(result, `${choice.customId} vs ${botChoice}`);

        ctx.commandInteraction.editReply({
            embeds: [embedMsg],
            components: [],
        });

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
