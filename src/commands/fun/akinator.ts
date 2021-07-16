import { Command, CommandContext } from "../../base/Command";
import { Aki } from "aki-api";
import { Message, MessageEmbed } from "discord.js";
import { sendMessage, sendReply, waitResponse } from "../../utils/functions";
import Logger from "../../utils/logger";

export default class Akinator implements Command {
    name = "akinator";
    category = "fun";
    description =
        "Start a game of Akinator! Choose from guessing characters, objects, or animals (defaults to characters).";
    usage = "akinator [characters | objects | animals]";
    examples = [
        "akinator",
        "akinator characters",
        "akinator objects",
        "akinator animals",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 30000; // 30 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        try {
            if (ctx.client.gameMembers.get(`${ctx.guild.id}${ctx.member.id}`) === "Akinator") {
                const embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Akinator")
                    .setDescription(
                        "You are already playing another game! Finish your first one."
                    )
                    .setFooter(
                        ctx.member.displayName,
                        ctx.author.avatarURL()
                    );

                sendMessage(ctx.client, embedMsg, ctx.channel);
                return;
            }

            ctx.client.gameMembers.set(
                `${ctx.guild.id}${ctx.member.id}`,
                "Akinator"
            );

            let category;
            if (args[0]) category = args[0];
            else category = "characters";

            let region;
            switch (category) {
                case "characters":
                    region = "en";
                    break;
                case "objects":
                    region = "en_objects";
                    break;
                case "animals":
                    region = "en_animals";
                    break;
                default:
                    region = "en";
            }

            let embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setTitle("Akinator")
                .setDescription(`🧠 Starting up... Guessing ${category}!`)
                .setFooter(
                    ctx.member.displayName,
                    ctx.author.avatarURL()
                );
            const startingMessage = await sendMessage(ctx.client, embedMsg, ctx.channel);
            if (!startingMessage) return;

            const aki = new Aki(region);
            await aki.start();

            startingMessage.delete();

            let questionCount = 0;
            let answer: Message | void;
            let userChoice: number;
            let newQuestion = true;
            let gameDone = false;
            do {
                embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("Akinator")
                    .setDescription("🤔 Thinking...")
                    .setFooter(
                        ctx.member.displayName,
                        ctx.author.avatarURL()
                    );
                let currentMessage: Message | void;
                if (newQuestion) {
                    currentMessage = await sendMessage(ctx.client, embedMsg, ctx.channel);

                    await aki.step(userChoice);
                    questionCount += 1;
                } else {
                    sendReply(ctx.client, "That's not a valid input. Please try again.", answer as Message);
                }

                embedMsg
                    .setDescription(`**#${questionCount}**: ${aki.question}`)
                    .setFooter(
                        `Options: ${aki.answers.join(", ")}, Cancel`,
                        ctx.author.avatarURL()
                    );
                if (currentMessage) await currentMessage.edit(embedMsg);
                else await sendMessage(ctx.client, embedMsg, ctx.channel);

                answer = await waitResponse(
                    ctx.client,
                    ctx.channel,
                    ctx.author,
                    60
                );
                if (!answer) {
                    const inactivityEmbed = new MessageEmbed()
                        .setColor("RED")
                        .setTitle("Akinator")
                        .setDescription("Cancelling game due to inactivity.")
                        .setFooter(
                            ctx.member.displayName,
                            ctx.author.displayAvatarURL()
                        );
                    sendMessage(ctx.client, inactivityEmbed, ctx.channel);

                    // Remove game state for user
                    ctx.client.gameMembers.delete(
                        `${ctx.guild.id}${ctx.member.id}`
                    );

                    return;
                }

                switch (answer.content.toLowerCase()) {
                    case "yes":
                        userChoice = 0;
                        newQuestion = true;
                        break;
                    case "no":
                        userChoice = 1;
                        newQuestion = true;
                        break;
                    case "don't know":
                    case "dont know":
                        userChoice = 2;
                        newQuestion = true;
                        break;
                    case "probably":
                        userChoice = 3;
                        newQuestion = true;
                        break;
                    case "probably not":
                        userChoice = 4;
                        newQuestion = true;
                        break;
                    case "cancel":
                        // eslint-disable-next-line no-case-declarations
                        const gameCancelledEmbed = new MessageEmbed()
                            .setColor("RED")
                            .setTitle("Akinator")
                            .setDescription("Game cancelled!")
                            .setFooter(
                                ctx.member.displayName,
                                ctx.author.displayAvatarURL()
                            );
                        sendMessage(ctx.client, gameCancelledEmbed, ctx.channel);

                        // Remove game state for user
                        ctx.client.gameMembers.delete(
                            `${ctx.guild.id}${ctx.member.id}`
                        );

                        return;
                    default:
                        newQuestion = false;
                }

                if (aki.progress >= 95 || aki.currentStep >= 80)
                    gameDone = true;
            } while (gameDone === false);

            await aki.win();

            const guess = aki.answers[0];

            embedMsg = new MessageEmbed()
                .setColor("GREEN")
                .setTitle("Akinator")
                .setDescription(
                    `**I'm ${guess.proba * 100}% sure it's...**\n\n${
                        guess.name
                    }\n*${guess.description}*`
                )
                .setThumbnail(guess.absolute_picture_path)
                .setFooter(
                    ctx.member.displayName,
                    ctx.author.displayAvatarURL()
                );

            sendMessage(ctx.client, embedMsg, ctx.channel);

            ctx.client.gameMembers.delete(
                `${ctx.guild.id}${ctx.member.id}`
            );
        } catch (err) {
            Logger.log("error", `Akinator error:\n${err}`);

            const embedMsg = new MessageEmbed()
                .setColor("RED")
                .setTitle("Akinator")
                .setDescription(
                    "Akinator is experiencing some issues right now sorry. Your game has been cancelled."
                )
                .setFooter(
                    ctx.member.displayName,
                    ctx.author.displayAvatarURL()
                );
            sendMessage(ctx.client, embedMsg, ctx.channel);

            // Remove game state for user
            ctx.client.gameMembers.delete(
                `${ctx.guild.id}${ctx.member.id}`
            );
        }
    }
}
