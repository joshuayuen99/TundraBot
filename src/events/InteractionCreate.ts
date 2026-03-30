import {
    Events,
    MessageFlags,
    type Interaction,
    type InteractionReplyOptions,
} from "discord.js";
import { type EventHandler } from "../base/EventHandler.ts";
import { Logger } from "../utils/Logger.ts";

export default class InteractionCreateHandler implements EventHandler {
    readonly event = Events.InteractionCreate;
    readonly once = false;

    async handle(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const slashCommand = interaction.client.slashCommands.get(
            interaction.commandName
        );
        if (!slashCommand) {
            Logger.warn(
                `No slash command handler matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            Logger.info(`Executing slash command: ${interaction.commandName}`);
            await slashCommand.execute(interaction);
        } catch (err) {
            Logger.error(
                `Error while executing ${interaction.commandName}: ${err}`
            );

            const followUpMessage = {
                content:
                    "There was an unexpected error while executing this command!",
                flags: MessageFlags.Ephemeral,
            } as InteractionReplyOptions;
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(followUpMessage);
            } else {
                await interaction.reply(followUpMessage);
            }
        }
    }
}
