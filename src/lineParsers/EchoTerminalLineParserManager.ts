import * as parser from './EchoTerminalLineParser'
import * as str from './EchoTerminalLineParserString'
import * as slog from './EchoTerminalLineParserSlog'
import * as keyvalue from './EchoTerminalLineParserKeyValue'

enum LineParserType {
    string = "string",
    slog = "slog",
    keyvalue = "keyvalue"
}

export class EchoTerminalLineParserManager {
    private parsers = new Map<string, parser.EchoTerminalLineParser>;

    constructor() {
        this.parsers.set(LineParserType.string, new str.EchoTerminalLineParserString())
        this.parsers.set(LineParserType.slog, new slog.EchoTerminalLineParserSlog())
        this.parsers.set(LineParserType.keyvalue, new keyvalue.EchoTerminalLineParserKeyValue())
    }

    public dispose() {}

    public parsedata(rawstring: string, formatType: string): string[] {

        let parser = this.parsers.get(formatType);
        if (!parser) {
            throw new Error(`unknown parser type (${formatType})`);
        }

        return parser.parse(rawstring);
    }
}