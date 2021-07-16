import AuthClient from "./auth-client";
import { TundraBot } from "../../base/TundraBot";
import { Guild } from "discord.js";
import Deps from "../../utils/deps";

export default class Sessions {
    client: TundraBot;
    AuthClient: AuthClient;
    sessions: Map<string, any>;
    constructor(client: TundraBot) {
        this.client = client;
        this.AuthClient = Deps.get<AuthClient>(AuthClient);
        this.sessions = new Map();
    }

    async get(key: string): Promise<any> {
        let data = this.sessions.get(key);
        if (data === undefined) data = await this.create(key);
        return data;
    }

    async create(key: string): Promise<any> {
        setTimeout(() => this.sessions.delete(key), 5 * 60 * 1000); // 5 mins
        await this.update(key);

        return this.sessions.get(key);
    }

    async update(key: string): Promise<any> {
        return this.sessions.set(key, {
            authUser: await this.AuthClient.authClient.getUser(key),
            authGuilds: this.getManageableGuilds(await this.AuthClient.authClient.getGuilds(key)),
        });
    }

    getManageableGuilds(authGuilds): Guild[] {
        const guilds = [];
        // loop through all the servers the user is in
        for (const id of authGuilds.keys()) {
            // check the user has MANAGE_GUILD permissions
            if (!authGuilds.get(id).permissions.includes("MANAGE_GUILD")) continue;
    
            const guild = this.client.guilds.cache.get(id);
            if (!guild) continue; // check that the bot is in the server as well
            guilds.push(guild);
        }
    
        return guilds;
    }
}