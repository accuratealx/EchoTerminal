import * as types from './EchoTerminalLineFormatter' 

export class EchoTerminalLineFormatterString implements types.EchoTerminalLineFormatter {
    format(rawstr: string): string[] {
        return [rawstr];
    }
}