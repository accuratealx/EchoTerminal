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
        
        // Парсим JSON строку в объект
        let obj: unknown;
        try {
            obj = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Invalid JSON string');
        }
        
        /**
         * Обрабатывает строковое значение, заменяя \t на пробелы
         * и разбивая по \n на отдельные строки
         */
        function processStringValue(str: string, indent: string, key: string): string[] {
            const lines: string[] = [];
            
            // Заменяем табуляцию на два пробела
            const processedStr = str.replace(/\t/g, '  ');
            
            // Разбиваем по переводам строк
            const stringLines = processedStr.split(/\r?\n/);
            
            if (stringLines.length === 1) {
                // Однострочная строка
                lines.push(`${indent}${key}: "${stringLines[0]}"\r`);
            } else {
                // Многострочная строка - ВАЖНО: добавляем \r после каждой внутренней строки
                lines.push(`${indent}${key}: "\r`);
                
                // Обрабатываем каждую строку, добавляя \r в конец для корректного вывода в Linux
                stringLines.forEach((line, index) => {
                    // Добавляем \r после каждой строки, кроме последней
                    if (index < stringLines.length - 1) {
                        lines.push(`${indent}  ${line}\r`);
                    } else {
                        lines.push(`${indent}  ${line}\r`);
                    }
                });
                
                lines.push(`${indent}"\r`);
            }
            
            return lines;
        }
        
        /**
         * Обрабатывает строковое значение без ключа
         */
        function processStringValueWithoutKey(str: string, indent: string): string[] {
            const lines: string[] = [];
            
            // Заменяем табуляцию на два пробела
            const processedStr = str.replace(/\t/g, '  ');
            
            // Разбиваем по переводам строк
            const stringLines = processedStr.split(/\r?\n/);
            
            if (stringLines.length === 1) {
                // Однострочная строка
                lines.push(`${indent}"${stringLines[0]}"\r`);
            } else {
                // Многострочная строка
                lines.push(`${indent}"`);
                
                // Обрабатываем каждую строку, добавляя \r в конец
                stringLines.forEach((line, index) => {
                    if (index < stringLines.length - 1) {
                        lines.push(`${indent}  ${line}\r`);
                    } else {
                        lines.push(`${indent}  ${line}\r`);
                    }
                });
                
                lines.push(`${indent}"\r`);
            }
            
            return lines;
        }
        
        /**
         * Рекурсивная функция для обработки значений JSON
         */
        function processValue(value: unknown, indentLevel: number = 0, key: string | null = null): void {
            const indent: string = ' '.repeat(indentLevel * indentSize);
            
            if (key !== null) {
                // Обработка значения с ключом
                if (value === null) {
                    result.push(`${indent}${key}: null\r`);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result.push(`${indent}${key}: []\r`);
                    } else {
                        result.push(`${indent}${key}: [\r`);
                        value.forEach((item, index) => {
                            processValue(item, indentLevel + 1, String(index));
                        });
                        result.push(`${indent}]\r`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    const keys = Object.keys(objValue);
                    
                    if (keys.length === 0) {
                        result.push(`${indent}${key}: {}\r`);
                    } else {
                        result.push(`${indent}${key}: {\r`);
                        for (const [nestedKey, nestedValue] of Object.entries(objValue)) {
                            processValue(nestedValue, indentLevel + 1, nestedKey);
                        }
                        result.push(`${indent}}\r`);
                    }
                } else if (typeof value === 'string') {
                    const stringLines = processStringValue(value, indent, key);
                    result.push(...stringLines);
                } else {
                    result.push(`${indent}${key}: ${String(value)}\r`);
                }
            } else {
                // Корневой элемент
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result.push(`[]\r`);
                    } else {
                        result.push(`[\r`);
                        value.forEach((item, index) => {
                            processValue(item, 1, String(index));
                        });
                        result.push(`]\r`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    const keys = Object.keys(objValue);
                    
                    if (keys.length === 0) {
                        result.push(`{}\r`);
                    } else {
                        result.push(`{\r`);
                        for (const [nestedKey, nestedValue] of Object.entries(objValue)) {
                            processValue(nestedValue, 1, nestedKey);
                        }
                        result.push(`}\r`);
                    }
                } else if (typeof value === 'string') {
                    const stringLines = processStringValueWithoutKey(value, '');
                    result.push(...stringLines);
                } else {
                    result.push(String(value)+ '\r');
                }
            }
        }
        
        processValue(obj);
        return result;
    }
}
