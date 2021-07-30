import { TundraBot } from "../base/TundraBot";
import Remind from "../commands/utility/remind";
import { DBReminder, reminderModel } from "../models/Reminder";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckReminders extends StartupHelper {
    DBReminderManager: DBReminder;
    RemindCommand: Remind;
    constructor(client: TundraBot) {
        super(client);
        this.DBReminderManager = Deps.get<DBReminder>(DBReminder);
        this.RemindCommand = Deps.get<Remind>(Remind);
    }

    async init(): Promise<void> {
        reminderModel
            .find()
            .then(async (reminders) => {
                const dateNow = new Date(Date.now());
                for (const reminder of reminders) {
                    try {
                        // Fetch user if not cached already
                        await this.client.users
                            .fetch(reminder.userID)
                            .catch(() => {
                                throw new Error(
                                    "User left all servers with bot in it"
                                );
                            });

                        // Reminder is in the future
                        if (reminder.endTime > dateNow) {
                            setTimeout(async () => {
                                this.RemindCommand.remind(
                                    this.client,
                                    reminder
                                );
                            }, reminder.endTime.getTime() - dateNow.getTime());
                        } else {
                            // Reminder end time has passed
                            this.RemindCommand.remind(this.client, reminder);
                        }
                    } catch (err) {
                        // user left all servers with bot in it
                    }
                }
                Logger.log("ready", `Loaded ${reminders.length} reminders`);
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error loading reminders from database:\n${err}`
                );
            });
    }
}
