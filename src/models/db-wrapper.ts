import { Document } from "mongoose";
import { TundraBot } from "../base/TundraBot";

export default abstract class DBWrapper<T1, T2 extends Document> {
    client: TundraBot;
    constructor(client: TundraBot) {
        this.client = client;
    }
    
    get(type: T1): Promise<T2> {
        return this.getOrCreate(type);
    }

    protected abstract getOrCreate(type: T1): Promise<T2>;
    abstract create(type: T1): Promise<T2>;

    save(savedType: T2): Promise<T2> {
        return savedType.save();
    }
}