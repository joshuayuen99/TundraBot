import { TundraBot } from "../../base/TundraBot";

export abstract class Route {
    protected client: TundraBot;
    constructor(client: TundraBot) {
        this.client = client;
    }
}