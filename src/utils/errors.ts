export class UnimplementedError extends Error {
    constructor() {
        super("Feature not implemented.");
        this.name = "UnimplementedError";
    }
}
