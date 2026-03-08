import { describe, expect, test, beforeEach } from '@jest/globals';
import { EchoTerminalLineParserSlog } from './EchoTerminalLineParserSlog';
import { log } from 'node:console';

describe('EchoTerminalLineParserSlog', () => {
    let parser: EchoTerminalLineParserSlog;

    beforeEach(() => {
        parser = new EchoTerminalLineParserSlog();
    });

    describe('Базовые случаи', () => {
        test('должен извлекать простую строку в скобках', () => {
            const input = 'текст до {привет мир} текст после';
            const result = parser.parse(input);
            expect(result).toEqual(['{привет мир}']);
        });

        test('должен извлекать несколько строк в скобках', () => {
            const input = '{первая} текст {вторая} еще текст {третья}';
            const result = parser.parse(input);
            expect(result).toEqual(['{первая}', '{вторая}', '{третья}']);
        });

        test('должен возвращать пустой массив, если нет скобок', () => {
            const input = 'просто строка без скобок';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен возвращать пустой массив для пустой строки', () => {
            const input = '';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });
    });

    describe('Вложенные скобки', () => {
        test('должен обрабатывать один уровень вложенности', () => {
            const input = '{внешняя {внутренняя} внешняя}';
            const result = parser.parse(input);
            expect(result).toEqual(['{внешняя {внутренняя} внешняя}']);
        });

        test('должен обрабатывать несколько уровней вложенности', () => {
            const input = '{уровень1 {уровень2 {уровень3} уровень2} уровень1}';
            const result = parser.parse(input);
            expect(result).toEqual(['{уровень1 {уровень2 {уровень3} уровень2} уровень1}']);
        });

        test('должен корректно обрабатывать несколько вложенных конструкций', () => {
            const input = '{первый {вложенный}} текст {второй {глубокий {уровень}}}';
            const result = parser.parse(input);
            expect(result).toEqual(['{первый {вложенный}}', '{второй {глубокий {уровень}}}']);
        });
    });

    describe('Экранирование', () => {
        test('должен игнорировать экранированные открывающие скобки \\{', () => {
            const input = '{нормальная скобка \\{экранированная{ внутри}';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен игнорировать экранированные закрывающие скобки \\}', () => {
            const input = '{текст с \\} экранированной скобкой}';
            const result = parser.parse(input);
            expect(result).toEqual(['{текст с \\} экранированной скобкой}']);
        });

        test('должен обрабатывать несколько экранированных символов подряд', () => {
            const input = '{текст \\{ с \\} экранированием \\{ \\} }';
            const result = parser.parse(input);
            expect(result).toEqual(['{текст \\{ с \\} экранированием \\{ \\} }']);
        });

        test('должен обрабатывать экранирование обратной косой черты', () => {
            const input = '{текст с \\\\ экранированием}';
            const result = parser.parse(input);
            expect(result).toEqual(['{текст с \\\\ экранированием}']);
        });
    });

    describe('Сложные случаи', () => {
        test('должен обрабатывать строку только со скобками', () => {
            const input = '{}';
            const result = parser.parse(input);
            expect(result).toEqual(['{}']);
        });

        test('должен обрабатывать пустые скобки в тексте', () => {
            const input = 'текст {} еще текст {} конец';
            const result = parser.parse(input);
            expect(result).toEqual(['{}', '{}']);
        });

        test('должен обрабатывать незакрытые скобки (игнорировать до конца)', () => {
            const input = '{незакрытая скобка без конца';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен обрабатывать незакрытые вложенные скобки', () => {
            const input = '{внешняя {внутренняя незакрытая';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен игнорировать лишние закрывающие скобки', () => {
            const input = '{нормальная} лишняя } скобка';
            const result = parser.parse(input);
            expect(result).toEqual(['{нормальная}']);
        });
    });

    describe('Граничные случаи', () => {
        test('должен обрабатывать очень длинную строку', () => {
            const longContent = 'a'.repeat(1000);
            const input = `{${longContent}}`;
            const result = parser.parse(input);
            expect(result).toEqual([`{${longContent}}`]);
        });

        test('должен обрабатывать специальные символы внутри скобок', () => {
            const input = '{!@#$%^&*()_+=-[];",.<>?/}';
            const result = parser.parse(input);
            expect(result).toEqual(['{!@#$%^&*()_+=-[];",.<>?/}']);
        });

        test('должен обрабатывать символы новой строки внутри скобок', () => {
            const input = '{первая линия\nвторая линия\r\nтретья линия}';
            const result = parser.parse(input);
            expect(result).toEqual(['{первая линия\nвторая линия\r\nтретья линия}']);
        });

        test('должен обрабатывать скобки сразу после экранирования', () => {
            const input = '{начало \\} сразу {после} экранирования}';
            const result = parser.parse(input);
            expect(result).toEqual(['{начало \\} сразу {после} экранирования}']);
        });
    });

    describe('Комбинации случаев', () => {
        test('сложный пример с вложенностью и экранированием', () => {
            const input = 'префикс {уровень1 {уровень2 \\{экранировано\\} уровень2} уровень1} суффикс {другой уровень}';
            const result = parser.parse(input);
            expect(result).toEqual([
                '{уровень1 {уровень2 \\{экранировано\\} уровень2} уровень1}',
                '{другой уровень}'
            ]);
        });

        test('несколько конструкций с разной вложенностью', () => {
            const input = '{прост} текст {с {вложенностью}} еще {с {двумя {уровнями}}} конец';
            const result = parser.parse(input);
            expect(result).toEqual([
                '{прост}',
                '{с {вложенностью}}',
                '{с {двумя {уровнями}}}'
            ]);
        });
    });

        describe('Сложные JSON-подобные строки', () => {
        test('должен извлекать JSON объекты с вложенными структурами и escape-последовательностями', () => {
            const input = `{"time":"2026-03-07T01:15:05.260588911+03:00","level":"DEBUG","msg":"------ Message start (KDCRepFields) ------\nMsgType: 13 - KRB_TGS_REP\nPVNO: 5\nCRealm: EXAMPLE.COM\nCName: 1 - host/red01.example.com\nPAData:\n\t(0) Type: 136 - PA-FX-FAST\n\t(0) Data: oIHYMIHVoIHSMIHPoAMCARKigccEgcSRTUJ+LSlxSZBgdknjn0edc4Mnp+Zg65h1qqVWHQNb+8MGfIEdZEiVWzbj+/QbMdETbWTYZCeDV7exIZbPOuNpfDkRmADS3Wq1/sMZ5JDHmtD3f7CctFy3RRNVPhDNyPpsPFIelYnK7vULRGurVVv4KfVFDZsr2vF33a3LP54MrE+PnCKn3KOUoart5p6khBSRZZyltUjladINQIsd28J8Y9zn+L/npjJolDurhvgUb+goxqQBFYBc1KkZ3VwGTNqV08XB\n\t(0) Data len: 219\nTicket:\n\tTktVNO: 5\n\tRealm: EXAMPLE.COM\n\tSName Type: 2\n\tSName String: ldap/ds01.example.com\n\tEncPart:\n\t\tKVNO: 1\n\t\tEType: 18\n\t\tCipher len: 1145\n\tDecryptedEncPart:\n\t\tCRealm: EXAMPLE.COM\n\t\tCName: 1 - host/red01.example.com\n\t\tAuthTime: 2026-03-06 22:15:05 +0000 UTC\n\t\tStartTime: \n\t\tEndTime: 2026-03-07 06:15:05 +0000 UTC\n\t\tRenewTill: \n\t\tCAddr:\n\t\tTransited.TRType: 1\n\t\tTransited.Contents len: 0\n\t\tFlags: 00280000 - PRE-AUTHENT(10),TRANSITED-POLICY-CHECKED(12),\n\t\tAuthorizationData:\n\t\t\t(0) type: 1, len: 926\n\t\tKey: type:18, len:32\nEncPart:\n\tKVNO: 0\n\tEType: 18\n\tCipher len: 216\nDecryptedEncPart:\n\tSRealm: EXAMPLE.COM\n\tSName: 3 - ldap/ds01.example.com\n\tCAddr:\n\tFlags: 00280000 - PRE-AUTHENT(10),TRANSITED-POLICY-CHECKED(12),\n\tNonce: 42476314\n\tPAData:\n\tAuthTime: 2026-03-06 22:15:05 +0000 UTC\n\tStartTime: \n\tEndTime: 2026-03-07 06:15:05 +0000 UTC\n\tRenewTill: \n\tKeyExpiration: \n\tKey: type:18, len:32\n\tLastReqs:\n\t\t(0): 0 - 1970-01-01 00:00:00 +0000 UTC\n------ Message End (KDCRepFields) ------\n","subsystem":"kerberos"}
    {"time":"2026-03-07T01:15:05.261230243+03:00","level":"DEBUG","msg":"TCP reply sent","subsystem":"kerberos","bytes":1788,"to":"10.10.0.75:60832"}`;
            
            const result = parser.parse(input);
            expect(result).toHaveLength(2);
        });

        test('должен корректно обрабатывать JSON объекты внутри JSON объектов', () => {
            const input = `{"outer":{"inner":"value"},"array":[1,2,3]}`;
            const result = parser.parse(input);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe('{"outer":{"inner":"value"},"array":[1,2,3]}');
        });
    });

    describe('Сложные случаи', () => {
        test('должен обрабатывать строку только со скобками', () => {
            const input = '{}';
            const result = parser.parse(input);
            expect(result).toEqual(['{}']);
        });

        test('должен обрабатывать пустые скобки в тексте', () => {
            const input = 'текст {} еще текст {} конец';
            const result = parser.parse(input);
            expect(result).toEqual(['{}', '{}']);
        });

        test('должен обрабатывать незакрытые скобки (игнорировать до конца)', () => {
            const input = '{незакрытая скобка без конца';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен обрабатывать незакрытые вложенные скобки', () => {
            const input = '{внешняя {внутренняя незакрытая';
            const result = parser.parse(input);
            expect(result).toEqual([]);
        });

        test('должен игнорировать лишние закрывающие скобки', () => {
            const input = '{нормальная} лишняя } скобка';
            const result = parser.parse(input);
            expect(result).toEqual(['{нормальная}']);
        });
    });

});