export function stripWhitespace(text: string) {
    return text
        .split("\n")
        .map((s) => s.trim())
        .join("\n");
}
