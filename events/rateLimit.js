const { stripIndents } = require("common-tags");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").RateLimitData} rateLimitInfo Rate limit info
*/
module.exports = async (client, rateLimitInfo) => {
    console.log(stripIndents`Rate limiting...
    Timeout: ${rateLimitInfo.timeout}
    Limit: ${rateLimitInfo.limit}
    Method: ${rateLimitInfo.method}
    Path: ${rateLimitInfo.path}
    Route: ${rateLimitInfo.route}`);
};