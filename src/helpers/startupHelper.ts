import { TundraBot } from "../base/TundraBot";

export abstract class StartupHelper {
    protected client: TundraBot;
    constructor(client: TundraBot) {
        this.client = client;
    }

    abstract init(): Promise<void>
}