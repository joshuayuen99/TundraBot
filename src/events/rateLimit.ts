import { RateLimitData } from "discord.js";
import { EventHandler } from "../base/EventHandler";

import { stripIndents } from "common-tags";
import Logger from "../utils/logger";

export default class RateLimitHandler extends EventHandler {
    async invoke(rateLimitInfo: RateLimitData): Promise<void> {
        Logger.log(
            "warn",
            stripIndents`Rate limiting...
            Timeout: ${rateLimitInfo.timeout}
            Limit: ${rateLimitInfo.limit}
            Method: ${rateLimitInfo.method}
            Path: ${rateLimitInfo.path}
            Route: ${rateLimitInfo.route}`
        );
    }
}
