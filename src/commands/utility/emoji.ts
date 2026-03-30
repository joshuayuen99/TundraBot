import {
    ChatInputCommandInteraction,
    InteractionContextType,
    parseEmoji,
    SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../../base/Command.ts";
import { Logger } from "../../utils/Logger.ts";
import { errorEmbed, successEmbed } from "../../utils/embeds.ts";

export default class Emoji implements SlashCommand {
    public readonly slashCommand = new SlashCommandBuilder()
        .setName("emoji")
        .setDescription("Emoji utility commands.")
        .setContexts(InteractionContextType.Guild)
        .addSubcommand((subCommand) =>
            subCommand
                .setName("steal")
                .setDescription("Steals an emoji from a server.")
                .addStringOption((option) =>
                    option
                        .setName("emoji")
                        .setDescription("The emoji to steal")
                        .setRequired(true)
                )
        );

    public readonly category = "Utility";
    public readonly enabled = true;
    public readonly requiresVC = false;
    public readonly botPermissions = [];
    public readonly memberPermissions = [];
    public readonly ownerOnly = false;
    public readonly premiumOnly = false;
    public readonly cooldown = 5000;

    public async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === "steal") {
            await this.stealEmoji(interaction);
        }
    }

    private async stealEmoji(interaction: ChatInputCommandInteraction) {
        const emojiString = interaction.options.getString("emoji", true);
        Logger.debug(emojiString);

        if (!interaction.guild) {
            const embed = errorEmbed()
                .setDescription("This command can only be used within a server")
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const partialEmoji = parseEmoji(emojiString);
        Logger.debug(partialEmoji);
        if (!partialEmoji || !partialEmoji.id) {
            await this.sendMissingDataEmbed(interaction, emojiString);
            return;
        }
        const emoji = await interaction.guild.emojis.fetch(partialEmoji.id);
        Logger.debug(emoji);

        if (!emoji) {
            await this.sendMissingDataEmbed(interaction, emojiString);
            return;
        }

        const embed = successEmbed()
            .setTitle("Stole Emoji")
            .setThumbnail(emoji.imageURL())
            .addFields({
                name: "URL",
                value: `[Direct Image Link](${emoji.imageURL()})`,
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    private async sendMissingDataEmbed(
        interaction: ChatInputCommandInteraction,
        emojiString: string
    ) {
        const embed = errorEmbed()
            .setDescription(`Couldn't find data for ${emojiString}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}
