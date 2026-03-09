import * as types from './EchoTerminalLineFormatter' 

export class EchoTerminalLineFormatterSlog implements types.EchoTerminalLineFormatter {
    format(rawstr: string): string[] {
        return this.jsonToFormattedLines(this.escapeSpecialChars(rawstr));
    }

    private escapeSpecialChars(str: string): string {
        return str
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    private jsonToFormattedLines(jsonString: string): string[] {
        const result: string[] = [];
        const indentSize: number = 2;
        
        let obj: unknown;
        try {
            obj = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Invalid JSON string');
        }
        
        function processStringValue(str: string, indent: string, key: string): string[] {
            const lines: string[] = [];
            const processedStr = str.replace(/\t/g, '  ');
            const stringLines = processedStr.split(/\r?\n/).filter(line => line !== '');
            
            if (stringLines.length === 1) {
                lines.push(`${indent}${key}: "${stringLines[0]}"`);
            } else {
                lines.push(`${indent}${key}: "`);

                stringLines.forEach((line, index) => {
                    lines.push(`${indent}  ${line}`);
                });
                
                lines.push(`${indent}"`);
            }
            
            return lines;
        }

        function processStringValueWithoutKey(str: string, indent: string): string[] {
            const lines: string[] = [];
            const processedStr = str.replace(/\t/g, '  ');
            const stringLines = processedStr.split(/\r?\n/);
            
            if (stringLines.length === 1) {
                lines.push(`${indent}"${stringLines[0]}"`);
            } else {
                lines.push(`${indent}"`);
                
                stringLines.forEach((line, index) => {
                    lines.push(`${indent}  ${line}`);
                });
                
                lines.push(`${indent}"`);
            }
            
            return lines;
        }

        function processValue(value: unknown, indentLevel: number = 0, key: string | null = null): void {
            const indent: string = ' '.repeat(indentLevel * indentSize);
            
            if (key !== null) {
                if (value === null) {
                    result.push(`${indent}${key}: null`);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result.push(`${indent}${key}: []`);
                    } else {
                        result.push(`${indent}${key}: [`);
                        value.forEach((item, index) => {
                            processValue(item, indentLevel + 1, String(index));
                        });
                        result.push(`${indent}]`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    const keys = Object.keys(objValue);
                    
                    if (keys.length === 0) {
                        result.push(`${indent}${key}: {}`);
                    } else {
                        result.push(`${indent}${key}: {`);
                        for (const [nestedKey, nestedValue] of Object.entries(objValue)) {
                            processValue(nestedValue, indentLevel + 1, nestedKey);
                        }
                        result.push(`${indent}}`);
                    }
                } else if (typeof value === 'string') {
                    const stringLines = processStringValue(value, indent, key);
                    result.push(...stringLines);
                } else {
                    result.push(`${indent}${key}: ${String(value)}`);
                }
            } else {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result.push(`[]`);
                    } else {
                        result.push(`[`);
                        value.forEach((item, index) => {
                            processValue(item, 1, String(index));
                        });
                        result.push(`]`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    const keys = Object.keys(objValue);
                    
                    if (keys.length === 0) {
                        result.push(`{}`);
                    } else {
                        result.push(`{`);
                        for (const [nestedKey, nestedValue] of Object.entries(objValue)) {
                            processValue(nestedValue, 1, nestedKey);
                        }
                        result.push(`}`);
                    }
                } else if (typeof value === 'string') {
                    const stringLines = processStringValueWithoutKey(value, '');
                    result.push(...stringLines);
                } else {
                    result.push(String(value));
                }
            }
        }
        
        processValue(obj);
        return result;
    }
}
