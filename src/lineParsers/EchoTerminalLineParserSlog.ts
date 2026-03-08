import * as types from './EchoTerminalLineParser' 

export class EchoTerminalLineParserSlog implements types.EchoTerminalLineParser {
    parse(rawstr: string): string[] {
        let result: string[] = [];
        let prevtoken = '';
        let isline = false;
        let line = '';
        let opens = 0;

        for (let i = 0; i < rawstr.length; i++) {
            const token = rawstr[i];

            //Новая линия
            if (token == '{' && prevtoken != '\\') {
                if (opens == 0) {
                    //Начало новой строки
                    opens = 1;
                    isline = true;
                    line = token;
                } else {
                    //внутри строки
                    opens++;
                    line = line + token;
                }
               
                prevtoken = token;
                continue;
            }
            
            // конец строки
            if (token == '}' && prevtoken != '\\') {

                if (opens == 1) {
                    //Конец строки
                    opens = 0;
                    isline = false;
                    line = line + token;
                    result.push(line);
                    line = '';
                } else {
                    //внутри строки
                    opens--;
                    line = line + token;
                }

                prevtoken = token;
                continue;
            }

            if (isline) {
                line = line + token;
                prevtoken = token;
            }
        }

        
        return result;
    }
}
