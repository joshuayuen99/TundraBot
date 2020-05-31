const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");

const ROCK = "⛰️";
const PAPER = "📰";
const SCISSORS = "✂️";
const emojiArray = [ROCK, PAPER, SCISSORS];
const DISAPPOINTED = "😞";

module.exports = {
    name: "rps",
    category: "fun",
    description: "Rock paper scissors game. React to one of the emojis to play.",
    usage: "rps",
    run: async (client, message, args) => {
        const embedMsg = new MessageEmbed()
            .setColor("#ffffff")
            .setFooter(message.guild.me.displayName, client.user.displayAvatarURL())
            .setDescription("React to one of these emojis to play the game!")
            .setTimestamp();

        const msg = await message.channel.send(embedMsg);
        const reacted = await promptMessage(msg, message.author, 30, emojiArray)
        // If they didn't respond back in time
        if (!reacted) {
            await msg.reactions.removeAll();
            return msg.edit(`Guess I win by default ${DISAPPOINTED}`);
        }

        const botChoice = emojiArray[Math.floor(Math.random() * emojiArray.length)];

        const result = await getResult(reacted, botChoice);
        await msg.reactions.removeAll()
            .catch(err => {
                console.error("Failed to remove reactions: ", err);
            });

        embedMsg
            .setDescription("")
            .addField(result, `${reacted} vs ${botChoice}`)

        msg.edit(embedMsg);
    }
};

function getResult(me, botChosen) {
    // User wins
    if ((me === ROCK && botChosen === SCISSORS) ||
        (me === PAPER && botChosen === ROCK) ||
        (me === SCISSORS && botChosen === PAPER)) {
        return "You won!";
    } else if (me === botChosen) {
        return "It's a tie!";
    } else {
        return "You lost!";
    }
}