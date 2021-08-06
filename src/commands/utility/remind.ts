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
        "remind 15m Walk dog",
        "remind 2h30m Game night",
        "remind 2.5d Football game",
        "remind 2 hours 15 minutes Make a call",
        "remind 6h 30m Laundry"
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

        const pattern = /([0-9]+(\.[0-9])*)+ *[A-z]+/gm;
        const joinedArgs = args.join(" ");

        let reminderDuration = 0;
        const timeUnits = joinedArgs.match(pattern);
        for (const timeUnit of timeUnits) {
            const unitDuration = ms(timeUnit);
            if (isNaN(unitDuration)) {
                sendReply(ctx.client, "I couldn't recognize that duration. Cancelling poll.", ctx.msg);
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
