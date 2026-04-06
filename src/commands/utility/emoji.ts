import {
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    Guild,
    GuildEmoji,
    InteractionContextType,
    MessageFlags,
    parseEmoji,
    SlashCommandBuilder,
} from "discord.js";
import { Category, type SlashCommand } from "../../base/Command.ts";
import { Logger } from "../../utils/Logger.ts";
import { errorEmbed } from "../../utils/embeds.ts";
import { MissingEmojiData } from "../../utils/errors.ts";
import { stripWhitespace } from "../../utils/stringUtils.ts";
import { type EmojiStealer } from "../../db/schema/emojiStealerMessage.ts";
import { type Emoji as EmojiRow } from "../../db/schema/emoji.ts";
import { type Message } from "../../db/schema/message.ts";
import {
    getEmojiInfoFromMessageId,
    insertEmojiStealerMessage,
} from "../../db/queries/emojiStealerMessageQueries.ts";
import { insertEmoji } from "../../db/queries/emojiQueries.ts";
import { insertGuildMessage } from "../../db/queries/messageQueries.ts";
import { DB } from "../../db/db.ts";

export default class Emoji implements SlashCommand {
    public readonly slashCommand = new SlashCommandBuilder()
        .setName("emoji")
        .setDescription("Emoji utility commands")
        .setContexts(InteractionContextType.Guild)
        .addSubcommand((subCommand) =>
            subCommand
                .setName(Subcommands.Steal)
                .setDescription("Steals an emoji from a server")
                .addStringOption((option) =>
                    option
                        .setName(Options.Emoji)
                        .setDescription("The emoji to steal")
                        .setRequired(true)
                )
        )
        .setContexts(InteractionContextType.Guild);

    public readonly category = Category.Utility;
    public readonly enabled = true;
    public readonly requiresVC = false;
    public readonly botPermissions = [];
    public readonly memberPermissions = [];
    public readonly ownerOnly = false;
    public readonly premiumOnly = false;
    public readonly cooldown = 5000;
    public readonly buttonInteractionCustomIds = Object.values(CustomIds);

    private readonly embedTitle = "Emoji Stealer";

    public async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() === Subcommands.Steal) {
            await this.stealEmojiCommand(interaction);
        }
    }

    public async handleButtons(interaction: ButtonInteraction) {
        if (interaction.customId === CustomIds.UploadEmoji) {
            await this.handleUploadEmojiButton(interaction);
        }
    }

    private async handleUploadEmojiButton(interaction: ButtonInteraction) {
        const messageId = BigInt(interaction.message.id);
        const emojiInfo = await getEmojiInfoFromMessageId(messageId);

        if (!emojiInfo) {
            const embed = errorEmbed().setDescription(
                "Had trouble fetching data for the emoji, please try this command again."
            );
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            const newEmoji = await this.uploadEmojiFromUrl(
                interaction.guild!,
                emojiInfo.url,
                emojiInfo.emojiName
            );

            Logger.debug(newEmoji.toString());

            const container = this.buildEmojiStealerContainer(
                interaction,
                newEmoji,
                true
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (err) {
            Logger.error(
                err,
                `There was an unexpected error uploading an emoji: ${err}`
            );

            const embed = errorEmbed()
                .setTitle(this.embedTitle)
                .setThumbnail(emojiInfo.url)
                .setDescription(
                    "There was an unexpected error uploading this emoji. Please try again later."
                );
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    private async stealEmojiCommand(interaction: ChatInputCommandInteraction) {
        const emojiOrMissingEmoji =
            await this.fetchEmojiFromInteraction(interaction);
        if (emojiOrMissingEmoji instanceof MissingEmojiData) {
            await this.sendMissingDataEmbed(
                interaction,
                emojiOrMissingEmoji.emojiString
            );
            return;
        }
        const emoji = emojiOrMissingEmoji;

        // Save emoji to DB
        const emojiRow: EmojiRow = {
            url: emoji.imageURL(),
        };
        let newEmojiRow = await insertEmoji(emojiRow);
        if (!newEmojiRow) {
            // We didn't return a result when inserting because we canceled the insert due to an already existing row
            newEmojiRow = (await DB.query.emojisTable.findFirst({
                where: {
                    url: emojiRow.url,
                },
            }))!;
        }

        const container = this.buildEmojiStealerContainer(
            interaction,
            emoji,
            false
        );

        const interactionResponse = await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
        const messageResponse = await interactionResponse.fetch();

        // Save response message to DB
        const messageRow: Message = {
            id: BigInt(messageResponse.id),
            channelId: BigInt(interaction.channelId),
            authorId: BigInt(interaction.client.user.id),
        };
        await insertGuildMessage(messageRow, BigInt(interaction.guildId!));

        // Save emoji stealer relation to DB
        const emojiStealerMessage: EmojiStealer = {
            emojiId: newEmojiRow.id!,
            messageId: BigInt(messageRow.id),
            guildEmojiId: BigInt(emoji.id),
            emojiName: emoji.name,
        };
        await insertEmojiStealerMessage(emojiStealerMessage);
    }

    private buildEmojiStealerContainer(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        emoji: GuildEmoji,
        uploadedEmoji: boolean
    ) {
        const container = new ContainerBuilder().addSectionComponents(
            (section) =>
                section
                    .addTextDisplayComponents((textDisplay) =>
                        textDisplay.setContent(`**${this.embedTitle}**`)
                    )
                    .addTextDisplayComponents((textDisplay) =>
                        textDisplay.setContent(
                            stripWhitespace(
                                `Name: \`${emoji.name}\`
                                ID: \`${emoji.id}\`

                                URL: [Direct Image Link](${emoji.imageURL()})`
                            )
                        )
                    )
                    .setThumbnailAccessory((thumbnail) =>
                        thumbnail.setURL(emoji.imageURL())
                    )
        );

        if (emoji.guild.id === interaction.guildId) {
            const uploadButton = new ButtonBuilder().setCustomId(
                CustomIds.UploadEmoji
            );
            if (uploadedEmoji) {
                uploadButton
                    .setLabel("Emoji Uploaded!")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);
            } else {
                uploadButton
                    .setLabel("Upload Emoji")
                    .setStyle(ButtonStyle.Primary);
            }

            container.addActionRowComponents((actionRow) =>
                actionRow.addComponents(uploadButton)
            );
        }

        if (uploadedEmoji) {
            container.setAccentColor(Colors.Green);
        } else {
            container.setAccentColor(Colors.Blue);
        }

        return container;
    }

    private async uploadEmojiFromUrl(
        guild: Guild,
        emojiUrl: string,
        emojiName: string
    ): Promise<GuildEmoji> {
        const response = await fetch(emojiUrl);
        const emojiData = await response.arrayBuffer();

        const newEmoji = await guild.emojis.create({
            name: emojiName,
            attachment: Buffer.from(emojiData),
        });

        return newEmoji;
    }

    private async fetchEmojiFromInteraction(
        interaction: ChatInputCommandInteraction
    ): Promise<GuildEmoji | MissingEmojiData> {
        const emojiString = interaction.options.getString(Options.Emoji, true);
        Logger.debug(emojiString);

        const partialEmoji = parseEmoji(emojiString);
        Logger.debug(partialEmoji);
        if (!partialEmoji || !partialEmoji.id) {
            return new MissingEmojiData(emojiString);
        }
        const emoji = await interaction.guild!.emojis.fetch(partialEmoji.id);
        Logger.debug(emoji);

        if (!emoji) {
            return new MissingEmojiData(emojiString);
        }

        return emoji;
    }

    private async sendMissingDataEmbed(
        interaction: ChatInputCommandInteraction,
        emojiString: string
    ) {
        const embed = errorEmbed().setDescription(
            `Couldn't find data for ${emojiString}`
        );

        await interaction.reply({ embeds: [embed] });
    }
}

const Subcommands = {
    Steal: "steal",
} as const;
type Subcommands = (typeof Subcommands)[keyof typeof Subcommands];

const Options = {
    Emoji: "emoji",
    Name: "name",
} as const;
type Options = (typeof Options)[keyof typeof Options];

const CustomIds = {
    UploadEmoji: "uploadEmoji",
} as const;
type CustomIds = (typeof CustomIds)[keyof typeof CustomIds];
