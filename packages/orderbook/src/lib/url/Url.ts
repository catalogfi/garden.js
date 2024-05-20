export class Url extends URL {
    constructor(endpoint: string, base: string | Url) {
        super(endpoint, base);
    }
    endpoint(endpoint: string) {
        return new Url(endpoint, this);
    }
    socket() {
        // is it https or http?
        if (this.protocol === "https:") {
            return this.origin.replace("https", "wss");
        } else if (this.protocol === "http:") {
            return this.origin.replace("http", "ws");
        } else {
            throw new Error("Invalid protocol");
        }
    }
}
