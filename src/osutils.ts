export function EOL(): string {
    var result = "\r";
    switch (process.platform) {
        case "linux":
            result = "\n";
        break;
        case "win32":
            result = "\r\n";
        break;
    }
    return result;
}