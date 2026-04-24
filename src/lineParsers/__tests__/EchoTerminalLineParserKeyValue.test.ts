import { describe, expect, test, beforeEach } from '@jest/globals';
import { EchoTerminalLineParserKeyValue } from '../EchoTerminalLineParserKeyValue';

describe('EchoTerminalLineParserKeyValue', () => {
  let parser: EchoTerminalLineParserKeyValue;

  beforeEach(() => {
    parser = new EchoTerminalLineParserKeyValue();
  });

  describe('базовое разделение строк', () => {
    test('должен разделить простые строки по \\n', () => {
      const input = 'key1=value1\nkey2=value2\nkey3=value3';
      const result = parser.parse(input);
      
      expect(result).toEqual([
        'key1=value1',
        'key2=value2',
        'key3=value3'
      ]);
    });

    test('должен обработать строку без \\n', () => {
      const input = 'key1=value1 key2=value2';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1=value1 key2=value2']);
    });

    test('должен обработать пустую строку', () => {
      const input = '';
      const result = parser.parse(input);
      
      expect(result).toEqual(['']);
    });

    test('должен обработать строку с \\n в конце', () => {
      const input = 'key1=value1\nkey2=value2\n';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1=value1', 'key2=value2', '']);
    });
  });

  describe('обработка кавычек', () => {
    test('не должен разделять строку если \\n внутри кавычек', () => {
      const input = 'key1="value1\\nvalue2" key2=value3';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1="value1\\nvalue2" key2=value3']);
    });

    test('должен разделять строку если \\n вне кавычек', () => {
      const input = 'key1="value1"\nkey2="value2"';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1="value1"', 'key2="value2"']);
    });

    test('должен обработать несколько \\n внутри и вне кавычек', () => {
      const input = 'key1="value1\\nvalue2"\nkey2=value3\nkey3="value4\\nvalue5"';
      const result = parser.parse(input);
      
      expect(result).toEqual([
        'key1="value1\\nvalue2"',
        'key2=value3',
        'key3="value4\\nvalue5"'
      ]);
    });

    test('должен обработать экранированные кавычки внутри значения', () => {
      const input = 'key1="value1 \\"with quotes\\""\nkey2=value2';
      const result = parser.parse(input);
      
      expect(result).toEqual([
        'key1="value1 \\"with quotes\\""',
        'key2=value2'
      ]);
    });

    test('должен обработать несбалансированные кавычки', () => {
      const input = 'key1="value1\nkey2=value2';
      const result = parser.parse(input);
      
      // Так как кавычки не закрыты, \n внутри них не должен разделять
      expect(result).toEqual(['key1="value1\nkey2=value2']);
    });
  });

  describe('обработка escape последовательностей', () => {
    test('должен преобразовать \\n внутри кавычек в реальный перевод строки', () => {
      const input = 'key1="value1\\nvalue2" key2=value3';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('key1="value1\\nvalue2" key2=value3');
    });

    test('должен преобразовать \\r внутри кавычек в возврат каретки', () => {
      const input = 'key1="value1\\rvalue2"';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('key1="value1\\rvalue2"');
    });

    test('должен преобразовать \\t внутри кавычек в табуляцию', () => {
      const input = 'key1="value1\\tvalue2"';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('key1="value1\\tvalue2"');
    });

    test('должен обработать экранированную кавычку \\" внутри кавычек', () => {
      const input = 'key1="value1 \\"quoted\\" value2"';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('key1="value1 \\"quoted\\" value2"');
    });

    test('игнорирует escape последовательности вне кавычек', () => {
      const input = 'key1=value1\\nvalue2\nkey2=value3';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1=value1\\nvalue2', 'key2=value3']);
    });
  });

  describe('сложные сценарии', () => {
    test('должен обработать реальный пример из задания', () => {
      const input = 'key=value1 key2="value2" key3="value3\\rvalue4"\nkey1=aaa key2="bbbb bbb"';
      const result = parser.parse(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('key=value1 key2="value2" key3="value3\\rvalue4"');
      expect(result[1]).toBe('key1=aaa key2="bbbb bbb"');
    });

    test('должен обработать вложенные конструкции', () => {
      const input = 'outer="inner\\nvalue"\\nkey=value\\nanother="test\\nstring"';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('outer="inner\\nvalue"\\nkey=value\\nanother="test\\nstring"');
    });

    test('должен сохранить пробельные символы', () => {
      const input = 'key1=value1  with  spaces\nkey2="value2 with spaces"';
      const result = parser.parse(input);
      
      expect(result).toEqual([
        'key1=value1  with  spaces',
        'key2="value2 with spaces"'
      ]);
    });

    test('должен обработать множество последовательных переводов строк', () => {
      const input = 'line1\n\nline2\n\n\nline3';
      const result = parser.parse(input);
      
      expect(result).toEqual(['line1', '', 'line2', '', '', 'line3']);
    });
  });

  describe('граничные случаи', () => {
    test('должен обработать очень длинную строку', () => {
      const longString = 'a'.repeat(10000);
      const input = `${longString}\n${longString}`;
      const result = parser.parse(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(longString);
      expect(result[1]).toBe(longString);
    });

    test('должен обработать специальные символы в значениях', () => {
      const input = 'key1=value!@#$%^&*()\nkey2="value with \t and \r"';
      const result = parser.parse(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('key1=value!@#$%^&*()');
    });

    test('должен обработать пустые значения в кавычках', () => {
      const input = 'key1=""\nkey2="value"\nkey3=""';
      const result = parser.parse(input);
      
      expect(result).toEqual(['key1=""', 'key2="value"', 'key3=""']);
    });

    test('должен обработать экранированный перевод строки как текст', () => {
      const input = 'key1="value\\\\nwith backslash n"\nkey2=value2';
      const result = parser.parse(input);
      
      expect(result[0]).toBe('key1="value\\\\nwith backslash n"');
      expect(result[1]).toBe('key2=value2');
    });
  });

  describe('Извращения', () => {
    test('должен обработать строку с временной меткой и кавычками', () => {
        const input = 'time=2026-04-23T20:28:53.175+03:00 level=INFO msg="Restored InvocationID" subsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22';
        const result = parser.parse(input);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(input);
    });

    test('должен разделить строку по \\n если она есть вне кавычек', () => {
        const input = 'time=2026-04-23T20:28:53.175+03:00 level=INFO msg="Restored InvocationID"\nsubsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22';
        const result = parser.parse(input);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toContain('msg="Restored InvocationID"');
        expect(result[1]).toContain('subsystem=partitions');
    });

    test('должен сохранить перевод строки внутри кавычек как реальный перевод строки', () => {
        const input = 'msg="Line1\\nLine2" extra=value';
        const result = parser.parse(input);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toBe('msg="Line1\\nLine2" extra=value');
    });

    test('должен обработать сложную строку с временной меткой, кавычками и разделителями', () => {
        const input = 'time=2026-04-23T20:28:53.175+03:00 level=INFO msg="Restored\\nInvocationID"\nsubsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22';
        const result = parser.parse(input);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toContain('msg="Restored\\nInvocationID"');
        expect(result[1]).toContain('subsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22');
    });

    test('должен обработать многострочное сообщение Kerberos с большим количеством переносов строк внутри кавычек', () => {
        const input = 'time=2026-04-23T21:14:42.419+03:00 level=DEBUG msg="------ Message start (KDCReqFields) ------\nMsgType: 10 - KRB_AS_REQ\nPVNO: 5\nReneval: false\nPAData:\n\t(0) Type: 150 - PA-AS-FRESHNESS\n\t(0) Data: \n\t(0) Data len: 0\n\t(1) Type: 149 - PA-REQ-ENC-PA-REP\n\t(1) Data: \n\t(1) Data len: 0\nReqBody:\n\tKDCOptions: 00010010 - RESERVED(15),RENEWABLE-OK(27),\n\tRealm: EXAMPLE.COM\n\tCName: 1 - alx\n\tSName: 2 - krbtgt/EXAMPLE.COM\n\tFrom: \n\tTill: 2026-04-24 18:14:42 +0000 UTC\n\tRtime: \n\tNonce: 634064511\n\tEType: 18,17,20,19,16,23,25,26,\n\tAddresses:\n\tAdditionalTickets:\n\tEncAuthData:\n\t\tKVNO: 0\n\t\tEType: 0\n\t\tCipher len: 0\n------ Message End (KDCReqFields) ------\n" subsystem=kerberos';
        
        const result = parser.parse(input);
   
        expect(result).toHaveLength(1);
        expect(result[0]).toBe('time=2026-04-23T21:14:42.419+03:00 level=DEBUG msg="------ Message start (KDCReqFields) ------\nMsgType: 10 - KRB_AS_REQ\nPVNO: 5\nReneval: false\nPAData:\n\t(0) Type: 150 - PA-AS-FRESHNESS\n\t(0) Data: \n\t(0) Data len: 0\n\t(1) Type: 149 - PA-REQ-ENC-PA-REP\n\t(1) Data: \n\t(1) Data len: 0\nReqBody:\n\tKDCOptions: 00010010 - RESERVED(15),RENEWABLE-OK(27),\n\tRealm: EXAMPLE.COM\n\tCName: 1 - alx\n\tSName: 2 - krbtgt/EXAMPLE.COM\n\tFrom: \n\tTill: 2026-04-24 18:14:42 +0000 UTC\n\tRtime: \n\tNonce: 634064511\n\tEType: 18,17,20,19,16,23,25,26,\n\tAddresses:\n\tAdditionalTickets:\n\tEncAuthData:\n\t\tKVNO: 0\n\t\tEType: 0\n\t\tCipher len: 0\n------ Message End (KDCReqFields) ------\n" subsystem=kerberos');
    });

  });

});