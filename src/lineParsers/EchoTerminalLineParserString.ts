import * as types from './EchoTerminalLineParser' 

export class EchoTerminalLineParserString implements types.EchoTerminalLineParser {
    parse(rawstr: string): string[] {
        //TODO: определение типа переноса строки так себе

        //Винда
        if (rawstr.includes('\r\n')) {
            return rawstr.split('\r\n');
        }

        //Линукс
        if (rawstr.includes('\n')) {
            return rawstr.split('\n');
        }

        //Мак ОС
        return rawstr.split('\r');
    }
}