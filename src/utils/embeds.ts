import { EmbedBuilder } from "discord.js";

export function successEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor("Green")
        .setTitle("Success")
        .setTimestamp();
}

export function errorEmbed(): EmbedBuilder {
    return new EmbedBuilder().setColor("Red").setTitle("Error").setTimestamp();
}

export function guildOnlyCommandEmbed(): EmbedBuilder {
    return errorEmbed().setDescription(
        "This command can only be used within a server."
    );
}
