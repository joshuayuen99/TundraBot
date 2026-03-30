import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../base/Command.ts";

export default class Ping implements SlashCommand {
    public readonly slashCommand = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!");

    public readonly category = "Utility";
    public readonly enabled = true;
    public readonly guildOnly = false;
    public readonly requiresVC = false;
    public readonly botPermissions = [];
    public readonly memberPermissions = [];
    public readonly ownerOnly = false;
    public readonly premiumOnly = false;
    public readonly cooldown = 5000;

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong!");
    }
}
