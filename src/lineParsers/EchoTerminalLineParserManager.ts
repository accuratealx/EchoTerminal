import { parse } from 'node:path';
import * as parser from './EchoTerminalLineParser'
import * as str from './EchoTerminalLineParserString'
import * as slog from './EchoTerminalLineParserSlog'

enum LineParserType {
    string = "string",
    slog = "slog"
}

export class EchoTerminalLineParserManager {
    private parsers = new Map<string, parser.EchoTerminalLineParser>;

    constructor() {
        this.parsers.set(LineParserType.string, new str.EchoTerminalLineParserString())
        this.parsers.set(LineParserType.slog, new slog.EchoTerminalLineParserSlog())
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