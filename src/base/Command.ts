import type {
    ChatInputCommandInteraction,
    PermissionResolvable,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export type Category = "Utility";

export interface SlashCommand {
    readonly slashCommand:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder;
    readonly category: Category;
    readonly enabled: boolean;
    readonly requiresVC: boolean;
    readonly botPermissions: PermissionResolvable[];
    readonly memberPermissions: PermissionResolvable[];
    readonly ownerOnly: boolean;
    readonly premiumOnly: boolean;
    /** Milliseconds */
    readonly cooldown: number;

    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
