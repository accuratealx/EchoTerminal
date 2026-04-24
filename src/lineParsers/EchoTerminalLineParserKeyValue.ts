import * as types from './EchoTerminalLineParser' 

export class EchoTerminalLineParserKeyValue implements types.EchoTerminalLineParser {
    parse(rawstr: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < rawstr.length; i++) {
            const token = rawstr[i];
            
            if (token === '"') {
                inQuotes = !inQuotes;
                current = current + token;
                continue;
            }
            
            if (token === '\n' && !inQuotes) {
                if (current.trim() !== "") {
                    result.push(current);
                }
                current = '';
                continue;
            }
            
            current = current + token;
        }
        
        if (current.trim() !== "") {
            result.push(current);
        }

        return result;
    }
}
