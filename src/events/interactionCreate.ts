import { EventHandler } from "../base/EventHandler";
import { Interaction, MessageEmbed } from "discord.js";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import { DBGuild, guildInterface } from "../models/Guild";
import { SlashCommandContext } from "../base/Command";
import {
    validateBotPermissions,
    validateMemberPermissions,
} from "../utils/validators";
import Logger from "../utils/logger";

export default class InteractionCreateHandler extends EventHandler {
    cmdCooldown: string[] = []; // user's command cooldowns with userIDs as keys

    protected DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async invoke(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;

        try {
            const interactionCommand = this.client.interactiveCommands.get(
                interaction.commandName
            );

            if (interactionCommand) {
                let guildSettings: Partial<guildInterface>;
                if (interaction.inGuild()) {
                    guildSettings = await this.DBGuildManager.get(
                        interaction.guild
                    );
                } else {
                    guildSettings = {};
                }

                const ctx = new SlashCommandContext(
                    this.client,
                    interactionCommand,
                    guildSettings,
                    interaction
                );

                let userCooldown = this.cmdCooldown[interaction.user.id];
                if (!userCooldown) {
                    // user hasn't run a command yet
                    this.cmdCooldown[interaction.user.id] = {};
                    userCooldown = this.cmdCooldown[interaction.user.id];
                }

                const time = userCooldown[interaction.commandName] || 0;
                if (
                    time &&
                    time > Date.now() &&
                    interaction.user.id !== process.env.OWNERID
                ) {
                    const seconds = Math.ceil((time - Date.now()) / 1000);

                    const cooldownEmbed = new MessageEmbed()
                        .setColor("RED")
                        .setDescription(
                            `❌ You must wait \`${seconds} second${
                                seconds > 1 ? "s" : ""
                            }\` to use \`${interaction.commandName}\` again.`
                        );

                    ctx.commandInteraction.reply({
                        embeds: [cooldownEmbed],
                        ephemeral: true,
                    });
                    return;
                }
                this.cmdCooldown[interaction.user.id][interaction.commandName] =
                    Date.now() + interactionCommand.cooldown;

                if (interaction.inGuild()) {
                    // guild
                    if (!validateBotPermissions(ctx)) return;
                    if (!validateMemberPermissions(ctx)) return;
                }

                // have to do different check because "strict" is disabled in tsconfig
                if (!interaction.guild) {
                    // DM
                    if (interactionCommand.guildOnly) {
                        interaction;
                        const guildOnlyEmbed = new MessageEmbed()
                            .setColor("RED")
                            .setDescription(
                                `❌ \`${interaction.commandName}\` is not useable in DM's.`
                            );

                        ctx.commandInteraction.reply({
                            embeds: [guildOnlyEmbed],
                        });
                        return;
                    }
                }

                Logger.log("cmd", `/${ctx.commandInteraction.commandName}`);

                interactionCommand.slashCommandExecute(ctx).catch((err) => {
                    Logger.log(
                        "error",
                        `Error running slash command </${ctx.commandInteraction.commandName}>:\n${err}`
                    );
                });
            }
        } catch (err) {
            Logger.log("error", `interactionCreate event error:\n${err}`);
        }
    }
}
