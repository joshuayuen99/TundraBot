export class UnimplementedError extends Error {
    constructor() {
        super("Feature not implemented.");
        this.name = "UnimplementedError";
    }
}

export class MissingEmojiData extends Error {
    public emojiString: string;
    constructor(emojiString: string) {
        super(`Missing emoji data for: ${emojiString}`);
        this.name = "MissingEmojiData";
        this.emojiString = emojiString;
    }
}
