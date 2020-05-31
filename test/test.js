const { assert, should, expect } = require("chai");
const { config } = require("dotenv");

const { Client } = require("discord.js");
const axios = require("axios");
const search = require("youtube-search");

config({
	path: __dirname + "/../.env"
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
			client = new Client({
				disableEveryone: false
			});
		})
		
		this.afterAll(() => {
			client.destroy();
		})

		it("Connects", function () {
			return client.login(process.env.DISCORDTOKEN);
		});
	});
	describe("YouTube API", function () {
		it("Connects", async function () {
			const videoOpts = {
				maxResults: 5,
				type: "video",
				key: process.env.YOUTUBEKEY
			};
			let { results, pageInfo } = await search("", videoOpts);
			assert.isNotNull(results);
		})
	});
});