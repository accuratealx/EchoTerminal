import * as formater from './EchoTerminalLineFormatter'
import * as str from './EchoTerminalLineFormatterString'
import * as slog from './EchoTerminalLineFormatterSlog'
import * as keyvalue from './EchoTerminalLineFormatterKeyValue'

enum LineParserType {
    string = "string",
    slog = "slog",
    keyvalue = "keyvalue"
}

export class EchoTerminalLineFormatterManager {
    private fmts = new Map<string, formater.EchoTerminalLineFormatter>;

    constructor() {
        this.fmts.set(LineParserType.string, new str.EchoTerminalLineFormatterString())
        this.fmts.set(LineParserType.slog, new slog.EchoTerminalLineFormatterSlog())
        this.fmts.set(LineParserType.keyvalue, new keyvalue.EchoTerminalLineFormatterKeyValue())
    }

    public dispose() {}

    public format(rawstring: string, formatType: string): string[] {

        let fmt = this.fmts.get(formatType);
        if (!fmt) {
            throw new Error(`unknown format type (${formatType})`);
        }

        return fmt.format(rawstring);
    }
}