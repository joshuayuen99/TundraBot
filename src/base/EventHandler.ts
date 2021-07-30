/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TundraBot } from "./TundraBot";

export abstract class EventHandler {
    protected client: TundraBot;
    constructor(client: TundraBot) {
        this.client = client;
    }

    abstract invoke(...args: any): Promise<any | void>;
}