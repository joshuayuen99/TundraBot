const { Aki } = require("aki-api");
const { MessageEmbed } = require("discord.js");
const { waitResponse } = require("../../functions");

module.exports = {
    name: "akinator",
    category: "fun",
    description: "Start a game of Akinator! Choose from guessing characters, objects, or animals (defaults to characters).",
    usage: "akinator [characters | objects | animals]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        try {
            if (client.gameMembers.has(`${message.guild.id}${message.member.id}`)) {
                let embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Akinator")
                    .setDescription("You are already playing another game! Finish your first one.")
                    .setFooter(message.member.displayName, message.author.avatarURL());

                message.channel.send(embedMsg);
                return;
            }

            client.gameMembers.set(`${message.guild.id}${message.member.id}`, "Akinator");

            let category;
            if (args[0]) category = args[0];
            else category = "characters";
            
            let region;
            switch (category) {
                case "characters":
                    region = "en";
                    break;
                case "objects":
                    region = "en_objects";
                    break;
                case "animals":
                    region = "en_animals";
                    break;
                default:
                    region = "en";
            }

            let embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setTitle("Akinator")
                .setDescription(`🧠 Starting up... Guessing ${category}!`)
                .setFooter(message.member.displayName, message.author.avatarURL());
            const startingMessage = await message.channel.send(embedMsg);

            const aki = new Aki(region);
            await aki.start();

            startingMessage.delete();

            let questionCount = 0;
            let answer;
            let userChoice;
            let newQuestion = true;
            let gameDone = false;
            do {
                embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("Akinator")
                    .setDescription("🤔 Thinking...")
                    .setFooter(message.member.displayName, message.author.avatarURL());
                let currentMessage;
                if (newQuestion) {
                    currentMessage = await message.channel.send(embedMsg);

                    await aki.step(userChoice);
                    questionCount += 1;
                } else {
                    await message.reply("That's not a valid input. Please try again.");
                }

                embedMsg
                    .setDescription(`**#${questionCount}**: ${aki.question}`)
                    .setFooter(`Options: ${aki.answers.join(", ")}, Cancel`, message.author.avatarURL())
                if (currentMessage) await currentMessage.edit(embedMsg);
                else await message.channel.send(embedMsg);

                answer = await waitResponse(client, message, message.author, 60);
                if (!answer) {
                    const inactivityEmbed = new MessageEmbed()
                        .setColor("RED")
                        .setTitle("Akinator")
                        .setDescription("Cancelling game due to inactivity.")
                        .setFooter(message.member.displayName, message.author.avatarURL());
                    message.channel.send(inactivityEmbed);

                    // Remove game state for user
                    client.gameMembers.delete(`${message.guild.id}${message.member.id}`);

                    return;
                }
                answer = answer.content;

                switch (answer.toLowerCase()) {
                    case "yes":
                        userChoice = 0;
                        newQuestion = true;
                        break;
                    case "no":
                        userChoice = 1;
                        newQuestion = true;
                        break;
                    case "don't know":
                    case "dont know":
                        userChoice = 2;
                        newQuestion = true;
                        break;
                    case "probably":
                        userChoice = 3;
                        newQuestion = true;
                        break;
                    case "probably not":
                        userChoice = 4;
                        newQuestion = true;
                        break;
                    case "cancel":
                        const gameCancelledEmbed = new MessageEmbed()
                            .setColor("RED")
                            .setTitle("Akinator")
                            .setDescription("Game cancelled!")
                            .setFooter(message.member.displayName, message.author.avatarURL());
                        message.channel.send(gameCancelledEmbed);

                        // Remove game state for user
                        client.gameMembers.delete(`${message.guild.id}${message.member.id}`);

                        return;
                    default:
                        newQuestion = false;
                }

                if (aki.progress >= 95 || aki.currentStep >= 80) gameDone = true;
            } while (gameDone === false);

            await aki.win();

            let guess;
            guess = aki.answers[0];

            embedMsg = new MessageEmbed()
                .setColor("GREEN")
                .setTitle("Akinator")
                .setDescription(`**I'm ${guess.proba * 100}% sure it's...**\n\n${guess.name}\n*${guess.description}*`)
                .setThumbnail(guess.absolute_picture_path)
                .setFooter(message.member.displayName, message.author.avatarURL());

            message.channel.send(embedMsg);

            client.gameMembers.delete(`${message.guild.id}${message.member.id}`);
        } catch (err) {
            console.error("Akinator error: ", err);

            let embedMsg = new MessageEmbed()
                .setColor("RED")
                .setTitle("Akinator")
                .setDescription("Akinator is experiencing some issues right now sorry. Your game has been cancelled.")
                .setFooter(message.member.displayName, message.author.avatarURL());
            message.channel.send(embedMsg);

            // Remove game state for user
            client.gameMembers.delete(`${message.guild.id}${message.member.id}`);
        }
    }
};