/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TundraBot } from "../base/TundraBot";

export default class Deps {
    static testing = false;
    
    private static deps: any[] = [];

    static build(...types: any): void {
        if (this.testing) return;
                          
        for (const Type of types) {
            try { this.deps.push(new Type()); }
            // catch { throw new TypeError(`Type '${Type}' could not be instantiated`); }
            // eslint-disable-next-line no-empty
            catch {}
        }
    }

    static buildDB(client: TundraBot, ...types: any): void {
        this.buildWithClient(client, ...types);
    }

    static buildWithClient(client: TundraBot, ...types: any): void {
        if (this.testing) return;

        for (const Type of types) {
            try { this.deps.push(new Type(client)); }
            // eslint-disable-next-line no-empty
            catch {}
        }
    }

    static get<T>(type: any): T {
        const service = this.deps.find(t => t instanceof type);
        return service || this.add(new type());
    }

    private static add<T>(instance: T): T {
        this.deps.push(instance);
        return instance;
    }
}