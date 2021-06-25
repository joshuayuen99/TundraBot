import { TundraBot } from "./TundraBot";

export interface Command {
    name: string;
    aliases?: string[];
    category: string;
    description: string;
    usage: string;
    examples?: string[];
    premiumOnly: boolean;
    enabled: boolean;
    guildOnly: boolean;
    botPermissions: string[];
    memberPermissions: string[];
    ownerOnly: boolean;
    cooldown?: number; // milliseconds

    run: (client: TundraBot, ...args: any) => Promise<any> | void
}