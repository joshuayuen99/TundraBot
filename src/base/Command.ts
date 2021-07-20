/* eslint-disable @typescript-eslint/no-explicit-any */
import { Guild, GuildMember, Message, PermissionString, TextChannel, User } from "discord.js";
import { guildInterface } from "../models/Guild";
import { TundraBot } from "./TundraBot";

export abstract class Command {
    name: string;
    aliases?: string[];
    category: string;
    description: string;
    usage: string;
    examples?: string[];
    enabled = true;
    guildOnly: boolean;
    botPermissions: PermissionString[];
    memberPermissions: PermissionString[];
    ownerOnly = false;
    premiumOnly = false;
    cooldown?: number; // milliseconds

    abstract execute(ctx: CommandContext, args: string[]): Promise<any | void>;

    shutdown?(): Promise<any | void>;
}

export class CommandContext {
    command: Command;
    msg: Message;
    member?: GuildMember;
    guild?: Guild;
    channel: TextChannel;
    author: User;
    client: TundraBot;
    guildSettings: Partial<guildInterface>;

    constructor(client: TundraBot, command: Command, guildSettings: Partial<guildInterface>, msg: Message) {
        this.command = command;
        this.msg = msg;
        this.member = msg.member;
        this.channel = msg.channel as TextChannel;
        this.guild = msg.guild;
        this.author = msg.author;
        this.client = client;
        this.guildSettings = guildSettings;
    }
}