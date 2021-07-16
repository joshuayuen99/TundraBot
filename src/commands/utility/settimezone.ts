import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply, waitResponse } from "../../utils/functions";
import { stripIndents } from "common-tags";
import moment from "moment-timezone";
import { DBUser } from "../../models/User";
import Deps from "../../utils/deps";

export default class SetTimeZone implements Command {
    name = "settimezone";
    aliases = ["setz"];
    category = "utility";
    description =
        "Changes a user's timezone. Used for time specific commands such as `event`.";
    usage = "settimezone [timezone]";
    examples = ["settimezone America/New_York"];
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    DBUserManager: DBUser;
    constructor() {
        this.DBUserManager = Deps.get<DBUser>(DBUser);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        // Get saved user settings or create new user if they don't exist yet
        let userSettings = await this.DBUserManager.get(ctx.author);

        // Changing timezone
        if (args[0]) {
            // Check if valid timezone
            if (!moment.tz.zone(args[0])) {
                sendReply(ctx.client, "I couldn't understand that timezone, cancelling command. Please check to make sure you copied your timezone correctly.", ctx.msg);
                return;
            }

            userSettings = await this.DBUserManager.update(ctx.author, { timezone: args[0] });

            sendMessage(ctx.client, `Saved! Your new timezone is \`${userSettings.settings.timezone}\`.`, ctx.channel);

            return;
        }
        
        // Display current timezone

        if (userSettings.settings.timezone) {
            sendMessage(ctx.client, `Your currently saved timezone is \`${userSettings.settings.timezone}\`.`, ctx.channel);
        }

        const timezonePromptMessage = await sendMessage(ctx.client, stripIndents`What timezone are you in?
        (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your \`TZ database name\`)`, ctx.channel);
        if (!timezonePromptMessage) return;

        const timezoneMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!timezoneMessage) {
            sendReply(ctx.client, "Cancelling settimezone.", timezonePromptMessage);
            return;
        }

        // Check if valid timezone
        if (!moment.tz.zone(timezoneMessage.content)) {
            sendReply(ctx.client, "I couldn't understand that timezone, cancelling command. Please check to make sure you copied your timezone correctly.", timezoneMessage);
            return;
        }

        userSettings = await this.DBUserManager.update(ctx.author, {
            timezone: timezoneMessage.content,
        });

        sendMessage(ctx.client, `Saved! Your new timezone is \`${userSettings.settings.timezone}\`.`, ctx.channel);

        return;
    }
}