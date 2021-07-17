import { Command, CommandContext } from "../../base/Command";
import {
    formatDateLong,
    sendMessage,
    sendReply,
} from "../../utils/functions";
import { MessageEmbed } from "discord.js";
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
        "remind 2h Game night",
        "remind 15m Walk dog",
        "remind 2d Football game",
    ];
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    DBReminderManager: DBReminder;
    constructor() {
        this.DBReminderManager = Deps.get<DBReminder>(DBReminder);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0] || !args[1]) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        if (isNaN(ms(args[0]))) {
            sendReply(
                ctx.client,
                "I couldn't recognize that duration. Cancelling reminder.",
                ctx.msg
            );
            return;
        }

        const startTime = ctx.msg.createdAt;
        const endTime = new Date(startTime.getTime() + ms(args[0]));

        // User entered a negative time
        if (endTime <= startTime) {
            sendReply(
                ctx.client,
                "I can't send you a reminder in the past!",
                ctx.msg
            );
            return;
        }

        const reminder = args.splice(1).join(" ");

        const embedMsg = new MessageEmbed()
            .setColor("YELLOW")
            .setFooter("Reminder set for")
            .setTimestamp(endTime)
            .setThumbnail(ctx.author.avatarURL())
            .setTitle("Reminder set")
            .setDescription(reminder)
            .addField("Reminder for", formatDateLong(endTime));

        sendMessage(ctx.client, embedMsg, ctx.channel);

        const reminderObject = {
            userID: ctx.author.id,
            reminder: reminder,
            startTime: startTime,
            endTime: endTime,
        } as reminderInterface;

        await this.DBReminderManager.create(reminderObject).then(
            (reminderObject) => {
                setTimeout(() => {
                    this.remind(ctx.client, reminderObject);
                }, endTime.getTime() - startTime.getTime());
            }
        ).catch((err) => {
            Logger.log("error", `Error creating new reminder in database:\n${err}`);
        });
    }

    async remind(
        client: TundraBot,
        reminder: reminderInterface
    ): Promise<void> {
        client.users
            .fetch(reminder.userID)
            .then((user) => {
                const remindEmbed = new MessageEmbed()
                    .setColor("YELLOW")
                    .setTitle("Reminder")
                    .setDescription(reminder.reminder)
                    .addField(
                        "Reminder for",
                        formatDateLong(reminder.endTime)
                    )
                    .setTimestamp(reminder.endTime);

                user.send(remindEmbed);
            })
            .catch(() => {
                // user left all servers with bot in it
            });
        
        this.DBReminderManager.delete(reminder).catch((err) => {
            Logger.log("error", `Error deleting reminder from database:\n${err}`);
        });
    }
}
