import {
    ButtonInteraction,
    ChatInputCommandInteraction,
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
        if (interaction.isChatInputCommand()) {
            await this.handleChatInputCommand(interaction);
            return;
        } else if (interaction.isButton()) {
            await this.handleButton(interaction);
        }
    }

    async handleChatInputCommand(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        try {
            await this.ensureDBRowsPresent(interaction);

            const slashCommand = interaction.client.slashCommands.get(
                interaction.commandName
            );
            if (!slashCommand) {
                Logger.warn(
                    `No slash command handler matching ${interaction.commandName} was found.`
                );
                return;
            }

            Logger.info(`Executing slash command: ${interaction.commandName}`);
            await slashCommand.execute(interaction);
        } catch (err) {
            Logger.error(
                err,
                `Error while executing ${interaction.commandName}: ${err}`
            );

            const followUpMessage: InteractionReplyOptions = {
                content:
                    "There was an unexpected error while executing this command!",
                flags: MessageFlags.Ephemeral,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(followUpMessage);
            } else {
                await interaction.reply(followUpMessage);
            }
        }
    }

    async handleButton(interaction: ButtonInteraction): Promise<void> {
        try {
            await this.ensureDBRowsPresent(interaction);

            const slashCommand =
                interaction.client.buttonInteractionHandlers.get(
                    interaction.customId
                );
            if (!slashCommand) {
                Logger.warn(
                    `No button interaction handler matching ${interaction.customId} was found.`
                );
                return;
            }

            Logger.info(`Handling button interaction: ${interaction.customId}`);
            await slashCommand.handleButtons!(interaction);
        } catch (err) {
            Logger.error(
                err,
                `Error while handling button interaction: ${interaction.customId}: ${err}`
            );

            const followUpMessage: InteractionReplyOptions = {
                content:
                    "There was an unexpected error while handling your button press!",
                flags: MessageFlags.Ephemeral,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(followUpMessage);
            } else {
                await interaction.reply(followUpMessage);
            }
        }
    }

    async ensureDBRowsPresent(interaction: Interaction) {
        if (interaction.guildId) {
            await interaction.client.memberRepository.createByUserAndGuildIds(
                BigInt(interaction.user.id),
                BigInt(interaction.guildId)
            );

            if (interaction.channelId) {
                await interaction.client.channelRepository.createGuildChannelById(
                    BigInt(interaction.channelId),
                    BigInt(interaction.guildId)
                );
            }
        } else {
            await interaction.client.userRepository.createById(
                BigInt(interaction.user.id)
            );

            if (interaction.channelId) {
                await interaction.client.channelRepository.createDMChannelById(
                    BigInt(interaction.channelId)
                );
            }
        }
    }
}
