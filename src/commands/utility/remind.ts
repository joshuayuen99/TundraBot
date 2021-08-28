import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { formatDateLong, sendReply } from "../../utils/functions";
import { ApplicationCommandOption, MessageEmbed } from "discord.js";
import ms from "ms";
import { DBReminder, reminderInterface } from "../../models/Reminder";
import Deps from "../../utils/deps";
import { TundraBot } from "../../base/TundraBot";
import Logger from "../../utils/logger";

export default class Remind implements Command {
    name = "remind";
    aliases = ["reminder", "remindme"];
    category = "utility";
    description =
        "Schedule a reminder to be DM'd to you after a certain amount of time.";
    usage = "remind <timer> <reminder>";
    examples = [
        "remind 15m Walk dog",
        "remind 2h30m Game night",
        "remind 2.5d Football game",
        "remind 2 hours 15 minutes Make a call",
        "remind 6h 30m Laundry",
    ];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription =
        "Schedule a reminder to be DM'd to you after a certain amount of time";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "timer",
            type: "STRING",
            description: "How long the timer should last (eg. 15m, 1h)",
            required: true,
        },
        {
            name: "reminder",
            type: "STRING",
            description: "What the reminder should be",
            required: true,
        },
    ];

    DBReminderManager: DBReminder;
    constructor() {
        this.DBReminderManager = Deps.get<DBReminder>(DBReminder);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0] || !args[1]) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        const pattern = /\b([0-9]{1,6}((\.[0-9]))*) *[A-z]+/gm;
        const joinedArgs = args.join(" ");

        let reminderDuration = 0;
        const timeUnits = joinedArgs.match(pattern) ?? args[0];
        for (const timeUnit of timeUnits) {
            const unitDuration = ms(timeUnit);
            if (isNaN(unitDuration)) {
                sendReply(
                    ctx.client,
                    "I couldn't recognize that duration. Cancelling reminder.",
                    ctx.msg
                );
                return;
            } else {
                reminderDuration += unitDuration;
            }
        }

        const startTime = ctx.msg.createdAt;
        const endTime = new Date(startTime.getTime() + reminderDuration);

        // User entered a negative time
        if (endTime <= startTime) {
            sendReply(
                ctx.client,
                "I can't send you a reminder in the past!",
                ctx.msg
            );
            return;
        }

        let finalTimeUnitIndex = 0;
        while (pattern.exec(joinedArgs) != null) {
            finalTimeUnitIndex = pattern.lastIndex;
        }

        const reminder = joinedArgs.substring(finalTimeUnitIndex);
        if (!reminder) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        const reminderObject = {
            userID: ctx.author.id,
            reminder: reminder,
            startTime: startTime,
            endTime: endTime,
        } as reminderInterface;

        await this.DBReminderManager.create(reminderObject)
            .then((reminderObject) => {
                const embedMsg = new MessageEmbed()
                    .setColor("YELLOW")
                    .setFooter("Reminder set for")
                    .setTimestamp(endTime)
                    .setThumbnail(ctx.author.avatarURL())
                    .setTitle("Reminder set")
                    .setDescription(reminder)
                    .addField("Reminder for", formatDateLong(endTime));

                sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);

                setTimeout(() => {
                    Remind.remind(ctx.client, reminderObject);
                }, endTime.getTime() - startTime.getTime());
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error creating new reminder in database:\n${err}`
                );

                sendReply(ctx.client, "Error setting reminder...", ctx.msg);
            });
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const timer = ctx.commandInteraction.options.getString("timer");
        const reminder = ctx.commandInteraction.options.getString("reminder");

        const pattern = /\b([0-9]{1,6}((\.[0-9]))*) *[A-z]+/gm;

        let reminderDuration = 0;
        const timeUnits = timer.match(pattern) ?? timer;
        for (const timeUnit of timeUnits) {
            const unitDuration = ms(timeUnit);
            if (isNaN(unitDuration)) {
                ctx.commandInteraction.reply({ content: "I couldn't recognize that duration. Cancelling reminder.", ephemeral: true });
                return;
            } else {
                reminderDuration += unitDuration;
            }
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + reminderDuration);

        // User entered a negative time
        if (endTime <= startTime) {
            ctx.commandInteraction.reply({ content: "I can't send you a reminder in the past!", ephemeral: true });
            return;
        }

        const reminderObject = {
            userID: ctx.author.id,
            reminder: reminder,
            startTime: startTime,
            endTime: endTime,
        } as reminderInterface;

        await this.DBReminderManager.create(reminderObject)
            .then((reminderObject) => {
                const embedMsg = new MessageEmbed()
                    .setColor("YELLOW")
                    .setFooter("Reminder set for")
                    .setTimestamp(endTime)
                    .setThumbnail(ctx.author.avatarURL())
                    .setTitle("Reminder set")
                    .setDescription(reminder)
                    .addField("Reminder for", formatDateLong(endTime));

                ctx.commandInteraction.reply({ embeds: [embedMsg] });

                setTimeout(() => {
                    Remind.remind(ctx.client, reminderObject);
                }, endTime.getTime() - startTime.getTime());
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error creating new reminder in database:\n${err}`
                );
                
                ctx.commandInteraction.reply({ content: "Error setting reminder...", ephemeral: true });
            });
    }

    static async remind(
        client: TundraBot,
        reminder: reminderInterface
    ): Promise<void> {
        const DBReminderManager = Deps.get<DBReminder>(DBReminder);

        client.users
            .fetch(reminder.userID)
            .then((user) => {
                const remindEmbed = new MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle("Reminder")
                    .setDescription(reminder.reminder)
                    .addField("Reminder for", formatDateLong(reminder.endTime))
                    .setTimestamp(reminder.endTime);

                user.send({ embeds: [remindEmbed] }).catch();
            })
            .catch(() => {
                // user left all servers with bot in it
            });

        DBReminderManager.delete(reminder).catch((err) => {
            Logger.log(
                "error",
                `Error deleting reminder from database:\n${err}`
            );
        });
    }
}
