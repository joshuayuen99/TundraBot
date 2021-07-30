import OAuthClient from "disco-oauth";

export default class AuthClient {
    authClient: OAuthClient;
    constructor() {
        this.authClient = new OAuthClient(process.env.BOT_ID, process.env.BOT_SECRET);
        this.authClient.setRedirect(`${process.env.DASHBOARD_URL}/auth`);
        this.authClient.setScopes("identify", "guilds");
    }
}