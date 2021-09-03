import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { Aki, region } from "aki-api";
import {
    ApplicationCommandOption,
    Message,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
    ThreadChannel,
} from "discord.js";
import { sendMessage, sendReply, waitResponse } from "../../utils/functions";
import Logger from "../../utils/logger";
import { guess } from "aki-api/typings/src/functions";

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
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.CREATE_INSTANT_INVITE,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK,
    ];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 30000; // 30 seconds
    slashDescription = "Start a game of Akinator!";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "category",
            type: "STRING",
            description: "The category to guess",
            required: false,
            choices: [
                {
                    name: "Characters",
                    value: "characters",
                },
                {
                    name: "Objects",
                    value: "objects",
                },
                {
                    name: "Animals",
                    value: "animals",
                },
            ],
        },
    ];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        let startingMessage: Message | void;
        let gameThread: ThreadChannel;
        try {
            if (
                ctx.client.gameMembers.get(
                    `${ctx.guild.id}${ctx.member.id}`
                ) === "Akinator"
            ) {
                const embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Akinator")
                    .setDescription(
                        "You are already playing another game! Finish your first one."
                    )
                    .setFooter(ctx.member.displayName, ctx.author.avatarURL());

                sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
                return;
            }

            ctx.client.gameMembers.set(
                `${ctx.guild.id}${ctx.member.id}`,
                "Akinator"
            );

            let category: string;
            if (args[0]) category = args[0];
            else category = "characters";

            let region: region;
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
                .setFooter(ctx.member.displayName, ctx.author.avatarURL());
            startingMessage = await sendReply(
                ctx.client,
                { embeds: [embedMsg] },
                ctx.msg
            );
            if (!startingMessage) return;

            const aki = new Aki({
                region: region,
                childMode: false,
                proxyOptions: null,
            });
            await aki.start();

            // start new thread for game
            gameThread = await startingMessage.startThread({
                autoArchiveDuration: 60,
                name: `${ctx.member.displayName}'s Akinator Game`,
            });

            startingMessage.edit({
                embeds: [
                    embedMsg.setDescription(
                        `Game in progress! Guessing ${category}!`
                    ),
                ],
            });

            let questionCount = 0;
            let answer: Message | void;
            let userChoice: 0 | 1 | 2 | 3 | 4;
            let newQuestion = true;
            let gameDone = false;
            do {
                embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("Akinator")
                    .setDescription("🤔 Thinking...")
                    .setFooter(ctx.member.displayName, ctx.author.avatarURL());
                let currentMessage: Message | void;
                if (newQuestion) {
                    currentMessage = await sendMessage(
                        ctx.client,
                        { embeds: [embedMsg] },
                        gameThread
                    );

                    await aki.step(userChoice);
                    questionCount += 1;
                } else {
                    sendReply(
                        ctx.client,
                        "That's not a valid input. Please try again.",
                        answer as Message
                    );
                }

                embedMsg
                    .setDescription(`**#${questionCount}**: ${aki.question}`)
                    .setFooter(
                        `Options: ${aki.answers.join(", ")}, Cancel`,
                        ctx.author.avatarURL()
                    );
                if (currentMessage)
                    await currentMessage.edit({ embeds: [embedMsg] });
                else
                    await sendMessage(
                        ctx.client,
                        { embeds: [embedMsg] },
                        gameThread
                    );

                answer = await waitResponse(
                    ctx.client,
                    gameThread,
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
                    sendMessage(
                        ctx.client,
                        { embeds: [inactivityEmbed] },
                        gameThread
                    );

                    // Remove game state for user
                    ctx.client.gameMembers.delete(
                        `${ctx.guild.id}${ctx.member.id}`
                    );

                    // Lock and archive thread
                    startingMessage.edit({
                        embeds: [embedMsg.setDescription("Game over!")],
                    });
                    gameThread.setLocked(true);
                    gameThread.setArchived(true);

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
                        sendMessage(
                            ctx.client,
                            { embeds: [gameCancelledEmbed] },
                            gameThread
                        );

                        // Remove game state for user
                        ctx.client.gameMembers.delete(
                            `${ctx.guild.id}${ctx.member.id}`
                        );

                        // Lock and archive thread
                        startingMessage.edit({
                            embeds: [embedMsg.setDescription("Game over!")],
                        });
                        gameThread.setLocked(true);
                        gameThread.setArchived(true);

                        return;
                    default:
                        newQuestion = false;
                }

                if (aki.progress >= 95 || aki.currentStep >= 80)
                    gameDone = true;
            } while (gameDone === false);

            await aki.win();

            const guess = aki.answers[0] as guess;

            embedMsg = new MessageEmbed()
                .setColor("GREEN")
                .setTitle("Akinator")
                .setDescription(
                    `**I'm ${Number(guess.proba) * 100}% sure it's...**\n\n${
                        guess.name
                    }\n*${guess.description}*`
                )
                .setThumbnail(guess.absolute_picture_path)
                .setFooter(
                    ctx.member.displayName,
                    ctx.author.displayAvatarURL()
                );

            sendMessage(ctx.client, { embeds: [embedMsg] }, gameThread);

            // Remove game state for user
            ctx.client.gameMembers.delete(`${ctx.guild.id}${ctx.member.id}`);

            // Lock and archive thread
            startingMessage.edit({
                embeds: [embedMsg.setDescription("Game over!")],
            });
            gameThread.setLocked(true);
            gameThread.setArchived(true);
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
            sendMessage(ctx.client, { embeds: [embedMsg] }, gameThread);

            // Remove game state for user
            ctx.client.gameMembers.delete(`${ctx.guild.id}${ctx.member.id}`);

            // Lock and archive thread
            if (startingMessage)
                startingMessage
                    .edit({ embeds: [embedMsg.setDescription("Game over!")] })
                    .catch();
            if (gameThread) {
                gameThread.setLocked(true);
                gameThread.setArchived(true);
            }
        }
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const category =
            ctx.commandInteraction.options.getString("category") ||
            "characters";

        let startingMessage: Message | void;
        let gameThread: ThreadChannel;
        try {
            if (
                ctx.client.gameMembers.get(
                    `${ctx.guild.id}${ctx.member.id}`
                ) === "Akinator"
            ) {
                const embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Akinator")
                    .setDescription(
                        "You are already playing another game! Finish your first one."
                    )
                    .setFooter(ctx.member.displayName, ctx.author.avatarURL());

                sendMessage(ctx.client, { embeds: [embedMsg] }, ctx.channel);
                return;
            }

            ctx.client.gameMembers.set(
                `${ctx.guild.id}${ctx.member.id}`,
                "Akinator"
            );

            let region: region;
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
                .setFooter(ctx.member.displayName, ctx.author.avatarURL());
            startingMessage = (await ctx.commandInteraction.reply({
                embeds: [embedMsg],
                fetchReply: true,
            })) as Message;
            if (!startingMessage) return;

            const aki = new Aki({
                region: region,
                childMode: false,
                proxyOptions: null,
            });
            await aki.start();

            // start new thread for game
            gameThread = await startingMessage.startThread({
                autoArchiveDuration: 60,
                name: `${ctx.member.displayName}'s Akinator Game`,
            });

            startingMessage.edit({
                embeds: [
                    embedMsg.setDescription(
                        `Game in progress! Guessing ${category}!`
                    ),
                ],
            });

            let questionCount = 0;
            let answer: Message | void;
            let userChoice: 0 | 1 | 2 | 3 | 4;
            let newQuestion = true;
            let gameDone = false;
            do {
                embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("Akinator")
                    .setDescription("🤔 Thinking...")
                    .setFooter(ctx.member.displayName, ctx.author.avatarURL());
                let currentMessage: Message | void;
                if (newQuestion) {
                    currentMessage = await sendMessage(
                        ctx.client,
                        { embeds: [embedMsg] },
                        gameThread
                    );

                    await aki.step(userChoice);
                    questionCount += 1;
                } else {
                    sendReply(
                        ctx.client,
                        "That's not a valid input. Please try again.",
                        answer as Message
                    );
                }

                embedMsg
                    .setDescription(`**#${questionCount}**: ${aki.question}`)
                    .setFooter(
                        `Options: ${aki.answers.join(", ")}, Cancel`,
                        ctx.author.avatarURL()
                    );
                if (currentMessage)
                    await currentMessage.edit({ embeds: [embedMsg] });
                else
                    await sendMessage(
                        ctx.client,
                        { embeds: [embedMsg] },
                        gameThread
                    );

                answer = await waitResponse(
                    ctx.client,
                    gameThread,
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
                    sendMessage(
                        ctx.client,
                        { embeds: [inactivityEmbed] },
                        gameThread
                    );

                    // Remove game state for user
                    ctx.client.gameMembers.delete(
                        `${ctx.guild.id}${ctx.member.id}`
                    );

                    // Lock and archive thread
                    startingMessage.edit({
                        embeds: [embedMsg.setDescription("Game over!")],
                    });
                    gameThread.setLocked(true);
                    gameThread.setArchived(true);

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
                        sendMessage(
                            ctx.client,
                            { embeds: [gameCancelledEmbed] },
                            gameThread
                        );

                        // Remove game state for user
                        ctx.client.gameMembers.delete(
                            `${ctx.guild.id}${ctx.member.id}`
                        );

                        // Lock and archive thread
                        startingMessage.edit({
                            embeds: [embedMsg.setDescription("Game over!")],
                        });
                        gameThread.setLocked(true);
                        gameThread.setArchived(true);

                        return;
                    default:
                        newQuestion = false;
                }

                if (aki.progress >= 95 || aki.currentStep >= 80)
                    gameDone = true;
            } while (gameDone === false);

            await aki.win();

            const guess = aki.answers[0] as guess;

            embedMsg = new MessageEmbed()
                .setColor("GREEN")
                .setTitle("Akinator")
                .setDescription(
                    `**I'm ${Number(guess.proba) * 100}% sure it's...**\n\n${
                        guess.name
                    }\n*${guess.description}*`
                )
                .setThumbnail(guess.absolute_picture_path)
                .setFooter(
                    ctx.member.displayName,
                    ctx.author.displayAvatarURL()
                );

            sendMessage(ctx.client, { embeds: [embedMsg] }, gameThread);

            // Remove game state for user
            ctx.client.gameMembers.delete(`${ctx.guild.id}${ctx.member.id}`);

            // Lock and archive thread
            startingMessage.edit({
                embeds: [embedMsg.setDescription("Game over!")],
            });
            gameThread.setLocked(true);
            gameThread.setArchived(true);
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
            sendMessage(ctx.client, { embeds: [embedMsg] }, gameThread);

            // Remove game state for user
            ctx.client.gameMembers.delete(`${ctx.guild.id}${ctx.member.id}`);

            // Lock and archive thread
            if (startingMessage)
                startingMessage
                    .edit({ embeds: [embedMsg.setDescription("Game over!")] })
                    .catch();
            if (gameThread) {
                gameThread.setLocked(true);
                gameThread.setArchived(true);
            }
        }
    }
}
