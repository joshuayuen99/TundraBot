/* eslint-disable no-case-declarations */
import {
    ButtonInteraction,
    CollectorFilter,
    CommandInteraction,
    Guild,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    TextChannel,
    User,
} from "discord.js";
import { TundraBot } from "../base/TundraBot";

enum ButtonIDs {
    First = "first",
    Previous = "previous",
    Next = "next",
    Last = "last",
}

export interface PaginatorContext {
    client: TundraBot;
    msg?: Message;
    commandInteraction?: CommandInteraction;
    member?: GuildMember;
    guild?: Guild;
    channel: TextChannel;
    author: User;
}

export interface PaginatorOptions {
    authorOnlyActions?: boolean;
    timer?: number; // milliseconds
}

export class Paginator {
    ctx: PaginatorContext;
    title?: string;
    description?: string;
    pages: MessageEmbed[];
    collectorFilter: CollectorFilter<[ButtonInteraction]>;
    authorOnlyActions: boolean;
    timer: number; // milliseconds

    currentPage: number;

    constructor(
        ctx: PaginatorContext,
        pages: MessageEmbed[],
        options?: PaginatorOptions
    ) {
        this.ctx = ctx;
        this.pages = pages;
        this.authorOnlyActions = options?.authorOnlyActions ?? true;
        this.timer = options?.timer ?? 5 * 60 * 1000;

        this.currentPage = 0;
    }

    async send(): Promise<Message> {
        const navigationButtons = this.getNavigationButtons();
        const embedMsg = this.pages[this.currentPage];
        embedMsg.setFooter(`Page 1 / ${this.pages.length}`);

        const message = await this.ctx.channel.send({
            embeds: [embedMsg],
            components: [navigationButtons],
        });

        this.createCollectors(message);

        return message;
    }

    async reply(): Promise<Message> {
        const navigationButtons = this.getNavigationButtons();
        const embedMsg = this.pages[this.currentPage];
        embedMsg.setFooter(`Page 1 / ${this.pages.length}`);

        const message = await this.ctx.msg.reply({
            embeds: [embedMsg],
            components: [navigationButtons],
        });

        this.createCollectors(message);

        return message;
    }

    async interactionReply(): Promise<Message> {
        const navigationButtons = this.getNavigationButtons();
        const embedMsg = this.pages[this.currentPage];
        embedMsg.setFooter(`Page 1 / ${this.pages.length}`);

        const message = (await this.ctx.commandInteraction.reply({
            embeds: [embedMsg],
            components: [navigationButtons],
            fetchReply: true,
        })) as Message;

        this.createCollectors(message);

        return message;
    }

    getNavigationButtons(): MessageActionRow {
        return new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(ButtonIDs.First)
                .setLabel("First")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(ButtonIDs.Previous)
                .setLabel("Previous")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(ButtonIDs.Next)
                .setLabel("Next")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(ButtonIDs.Last)
                .setLabel("Last")
                .setStyle("PRIMARY")
        );
    }

    createCollectors(message: Message): void {
        const collector = message.createMessageComponentCollector({
            componentType: "BUTTON",
            time: this.timer,
        });

        collector.on("collect", (i) => {
            const intendedUser = this.authorOnlyActions
                ? i.user.id === this.ctx.author.id
                : true;

            if (!intendedUser) {
                i.reply({
                    content: "These buttons aren't for you!",
                    ephemeral: true,
                });

                return;
            }

            const navigationButtons = this.getNavigationButtons();

            let embedMsg: MessageEmbed;
            switch (i.customId) {
                case ButtonIDs.First:
                    this.currentPage = 0;
                    embedMsg = this.pages[this.currentPage];
                    embedMsg.setFooter(
                        `Page ${this.currentPage + 1} / ${this.pages.length}`
                    );

                    i.update({
                        embeds: [embedMsg],
                        components: [navigationButtons],
                    });

                    break;
                case ButtonIDs.Previous:
                    this.currentPage =
                        (this.currentPage + (this.pages.length - 1)) %
                        this.pages.length;
                    embedMsg = this.pages[this.currentPage];
                    embedMsg.setFooter(
                        `Page ${this.currentPage + 1} / ${this.pages.length}`
                    );

                    i.update({
                        embeds: [embedMsg],
                        components: [navigationButtons],
                    });

                    break;
                case ButtonIDs.Next:
                    this.currentPage =
                        (this.currentPage + 1) % this.pages.length;
                    embedMsg = this.pages[this.currentPage];
                    embedMsg.setFooter(
                        `Page ${this.currentPage + 1} / ${this.pages.length}`
                    );

                    i.update({
                        embeds: [this.pages[this.currentPage]],
                        components: [navigationButtons],
                    });

                    break;
                case ButtonIDs.Last:
                    this.currentPage = this.pages.length - 1;
                    embedMsg = this.pages[this.currentPage];
                    embedMsg.setFooter(
                        `Page ${this.currentPage + 1} / ${this.pages.length}`
                    );

                    i.update({
                        embeds: [this.pages[this.currentPage]],
                        components: [navigationButtons],
                    });

                    break;
                default:
                    break;
            }
        });

        collector.on("end", (collected) => {
            const embedMsg = this.pages[this.currentPage];

            message.edit({ embeds: [embedMsg], components: [] });
        });
    }
}
