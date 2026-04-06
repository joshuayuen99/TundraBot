import type {
    ButtonInteraction,
    ChatInputCommandInteraction,
    PermissionResolvable,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

const Category = {
    Utility: "Utility",
} as const;
type Category = (typeof Category)[keyof typeof Category];
export { Category };

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
    readonly buttonInteractionCustomIds: string[];

    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    handleButtons?: (interaction: ButtonInteraction) => Promise<void>;
}
