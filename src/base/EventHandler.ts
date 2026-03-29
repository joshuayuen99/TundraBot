import type { ClientEvents } from "discord.js";

export interface EventHandler {
    readonly event: keyof ClientEvents;
    readonly once: boolean;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handle: (...args: any[]) => Promise<void>;
}
