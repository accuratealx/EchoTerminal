import * as types from './EchoTerminalLineFormatter'

export class EchoTerminalLineFormatterKeyValue implements types.EchoTerminalLineFormatter {
    format(rawstr: string): string[] {
        return this.parseKeyValueToFormattedLines(rawstr);
    }

    private parseKeyValueToFormattedLines(input: string): string[] {
        const result: string[] = [];
        const indentSize: number = 2;
        
        const parsed = this.parseKeyValueString(input);
        
        // Если парсинг не дал результатов, возвращаем пустой массив
        if (Object.keys(parsed).length === 0) {
            return [];
        }
        
        const processValue = (value: unknown, indentLevel: number = 0, key: string | null = null): void => {
            const indent: string = ' '.repeat(indentLevel * indentSize);
            
            if (key !== null) {
                if (value === null) {
                    result.push(`${indent}${key}: null`);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result.push(`${indent}${key}: []`);
                    } else {
                        result.push(`${indent}${key}: [`);
                        value.forEach((item, idx) => {
                            processValue(item, indentLevel + 1, String(idx));
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
                    this.processStringValue(value, indent, key, result);
                } else {
                    result.push(`${indent}${key}: ${String(value)}`);
                }
            } else {
                if (typeof value === 'string') {
                    this.processStringValueWithoutKey(value, '', result);
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    for (const [nestedKey, nestedValue] of Object.entries(objValue)) {
                        processValue(nestedValue, 1, nestedKey);
                    }
                } else {
                    result.push(String(value));
                }
            }
        };
        
        // Добавляем открывающую фигурную скобку
        result.push('{');
        
        // Обрабатываем все поля с отступом в 2 пробела
        for (const [key, value] of Object.entries(parsed)) {
            processValue(value, 1, key);
        }
        
        // Добавляем закрывающую фигурную скобку
        result.push('}');
        
        return result;
    }

    private parseKeyValueString(str: string): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        let i = 0;
        const len = str.length;
        
        while (i < len) {
            // Пропускаем пробелы
            while (i < len && str[i] === ' ') i++;
            if (i >= len) break;
            
            // Запоминаем позицию начала ключа
            const keyStart = i;
            
            // Читаем ключ
            let key = '';
            while (i < len && str[i] !== '=' && str[i] !== ' ') {
                key += str[i];
                i++;
            }
            
            // Проверяем, есть ли после ключа '='
            let hasEquals = false;
            let j = i;
            while (j < len && str[j] === ' ') j++;
            if (j < len && str[j] === '=') {
                hasEquals = true;
            }
            
            if (!hasEquals) {
                // Нет знака = — значит это не пара ключ-значение, прерываем разбор
                break;
            }
            
            // Пропускаем пробелы и '='
            while (i < len && (str[i] === ' ' || str[i] === '=')) i++;
            
            // Читаем значение (как было)
            let value: unknown;
            
            if (str[i] === '"') {
                i++;
                let quotedValue = '';
                while (i < len) {
                    if (str[i] === '\\' && i + 1 < len) {
                        const nextChar = str[i + 1];
                        if (nextChar === 'n') {
                            quotedValue += '\n';
                        } else if (nextChar === 'r') {
                            quotedValue += '\r';
                        } else if (nextChar === 't') {
                            quotedValue += '\t';
                        } else if (nextChar === '"') {
                            quotedValue += '"';
                        } else if (nextChar === '\\') {
                            quotedValue += '\\';
                        } else {
                            quotedValue += nextChar;
                        }
                        i += 2;
                    } else if (str[i] === '"') {
                        i++;
                        break;
                    } else {
                        quotedValue += str[i];
                        i++;
                    }
                }
                value = quotedValue;
            } else {
                let rawValue = '';
                while (i < len && str[i] !== ' ' && str[i] !== '\t') {
                    rawValue += str[i];
                    i++;
                }
                value = this.parseValueType(rawValue);
            }
            
            result[key] = value;
        }
    
        return result;
    }

    private parseValueType(value: string): unknown {
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        return value;
    }

    private processStringValue(str: string, indent: string, key: string, result: string[]): void {
        const processedStr = str;
        const stringLines = processedStr.split(/\r?\n/);
        
        if (stringLines.length === 1) {
            result.push(`${indent}${key}: "${stringLines[0]}"`);
        } else {
            result.push(`${indent}${key}: "`);
            
            stringLines.forEach((line) => {
                if (line !== '') {
                    result.push(`${indent}  ${line}`);
                } else {
                    result.push(`${indent}  `);
                }
            });
            
            result.push(`${indent}"`);
        }
    }

    private processStringValueWithoutKey(str: string, indent: string, result: string[]): void {
        const processedStr = str;
        const stringLines = processedStr.split(/\r?\n/);
        
        if (stringLines.length === 1) {
            result.push(`${indent}"${stringLines[0]}"`);
        } else {
            result.push(`${indent}"`);
            
            stringLines.forEach((line) => {
                if (line !== '') {
                    result.push(`${indent}  ${line}`);
                } else {
                    result.push(`${indent}  `);
                }
            });
            
            result.push(`${indent}"`);
        }
    }
}