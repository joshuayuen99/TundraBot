const { assert, should, expect } = require("chai");
const { config } = require("dotenv");

const { Client, Intents } = require("discord.js");
const axios = require("axios");
const search = require("youtube-search");

config({
    path: __dirname + "/../.env",
});

/*
describe('Array', function () {
	describe('#indexOf()', function () {
		it('should return -1 when the value is not present', function () {
			assert.equal([1, 2, 3].indexOf(4), -1);
		});
	});
});
*/
describe("API Connections", function () {
    describe("Discord API", function () {
        let client;
        this.beforeAll(() => {
            const intents = new Intents([
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                Intents.FLAGS.GUILD_INVITES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES,
            ]);
            client = new Client({ intents: intents, partials: ["CHANNEL"] });
        });

        this.afterAll(() => {
            client.destroy();
        });

        it("Connects", function () {
            return client.login(process.env.DISCORDTOKEN);
        });
    });
});
