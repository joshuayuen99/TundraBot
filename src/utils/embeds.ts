import { EmbedBuilder } from "discord.js";

export function successEmbed(): EmbedBuilder {
    return new EmbedBuilder().setColor("Green").setTitle("Success");
}

export function errorEmbed(): EmbedBuilder {
    return new EmbedBuilder().setColor("Red").setTitle("Error");
}
