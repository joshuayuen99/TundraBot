import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Category, type SlashCommand } from "../../base/Command.ts";
import { successEmbed } from "../../utils/embeds.ts";

export default class Ping implements SlashCommand {
    public readonly slashCommand = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!");

    public readonly category = Category.Utility;
    public readonly enabled = true;
    public readonly guildOnly = false;
    public readonly requiresVC = false;
    public readonly botPermissions = [];
    public readonly memberPermissions = [];
    public readonly ownerOnly = false;
    public readonly premiumOnly = false;
    public readonly cooldown = 5000;
    public readonly buttonInteractionCustomIds: string[] = [];

    public async execute(interaction: ChatInputCommandInteraction) {
        const embed = successEmbed().setTitle("Pong!");
        await interaction.reply({ embeds: [embed] });
    }
}
