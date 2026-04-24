import * as vscode from 'vscode';
import * as etterm from './EchoTerminal'
import * as config from './EchoTermnalConfig'
import * as log from './EchoTerminalJournal'
import * as lparser from './lineParsers/EchoTerminalLineParserManager'
import * as fmt from "./lineFormatters/EchoTerminalLineFormatterManager"


export class EchoTerminalManager {
    private cfg: config.EchoTermnalConfig;
    private commonTerm: etterm.EchoTerminal;
    private journal: log.EchoTerminalJournal;
    private lineMgr: lparser.EchoTerminalLineParserManager;
    private formatter: fmt.EchoTerminalLineFormatterManager;
    private multiTerms: Map<string, etterm.EchoTerminal>;

    constructor(acfg: config.EchoTermnalConfig, ajournal: log.EchoTerminalJournal) {
        //Записать настройки
        this.cfg = acfg;
        this.journal = ajournal;

        //Парсер строк
        this.lineMgr = new lparser.EchoTerminalLineParserManager();

        //форматтер строк
        this.formatter = new fmt.EchoTerminalLineFormatterManager();

        //Многотерминалов
        this.multiTerms = new Map<string, etterm.EchoTerminal>();

        //Общий терминал
        this.commonTerm = this.NewCommonTerminal();

        //Покажем терминал
        this.updateTerminalVisible();

        //Подпишемся на закрытие терминала
        this.SubscribeTerminalClose();
    }

    private NewCommonTerminal(): etterm.EchoTerminal {
        const title = vscode.l10n.t("Echo terminal (common)");
        return new etterm.EchoTerminal(title, this.cfg.InitialDelay());
    }

    public dispose() {
        this.commonTerm?.dispose();
        this.journal?.dispose();
        this.lineMgr?.dispose();
        this.formatter?.dispose();
        this.clearMultiTerminals();
    }

    private SubscribeTerminalClose() {
        const subscr = vscode.window.onDidCloseTerminal((CloseTerminal) => {
            if (this.commonTerm) {
                if (CloseTerminal.name == this.commonTerm.Name() && !this.commonTerm.GetDisabled()) {
                    //Создадим терминал по новой
                    this.commonTerm?.dispose();
                    this.commonTerm = this.NewCommonTerminal();
                    this.updateTerminalVisible();

                    //Покажем уведомление
                    const msg = vscode.l10n.t("The shared echo terminal cannot be closed. To hide it, use the Enabled setting");
                    vscode.window.showWarningMessage(msg);
                }

                //Тут проверим нет ли в словаре мультитерминала, и если есть, то удалим запись
                const {key, term} = this.getTerminalByName(CloseTerminal.name);
                if (term) {
                    term.dispose();
                    this.multiTerms.delete(key);
                }
            }
        });
    }

    private getTerminalByName(tname: string): {
        key: string, 
        term: etterm.EchoTerminal | null
    } {
        for (const [name, term] of this.multiTerms) {
            if (tname === term.Name()) {
                return {
                    key: name, 
                    term: term
                };
            }
        }
        return {
            key: "", 
            term: null
        };
    }
    

    private updateTerminalVisible() {
        if (this.cfg.enable) {
            if (this.cfg.SingleTerminal()) {
                this.commonTerm.Show();
                this.clearMultiTerminals();
            } else {
                this.commonTerm.hide();
            }
        } else {
            this.commonTerm.hide();
            this.clearMultiTerminals();
        }
    }

    private clearMultiTerminals() {
        for (const [name, term] of this.multiTerms) {
            term?.dispose();
        }
        this.multiTerms.clear();
    }

    //Обновить настройки
    public updateConfig(acfg: config.EchoTermnalConfig) {
        this.cfg = acfg;

        //Поднимем флаг неактивности для сообщения
        this.commonTerm?.Disable();

        //Изменим задержку инициализации териналов
        this.commonTerm?.SetInitialDelay(this.cfg.InitialDelay());
        for (const [, term] of this.multiTerms) {
            term?.SetInitialDelay(this.cfg.InitialDelay());
        }

        this.updateTerminalVisible();
    }

    //Основной обработчик событий записи в терминалы
    public async handler(e: vscode.TerminalShellExecutionStartEvent) {
        //Выход если не работаем
        if (!this.cfg.Enable()) {
            return;
        }

        //Пропустим терминалы которые не нужны
        const name = e.terminal.name;
        if (!this.isHookTerminal(name)) {
            return;
        }

        //Получить вывод в консоль
        try {
            const stream = e.execution.read();
            for await (const data of stream) {
                this.processClearTerminalData(name, this.cleanTerminalData(data))
            }

           /*const s = '{"time":"2026-03-07T01:15:05.260588911+03:00","level":"DEBUG","msg":"------ Message start (KDCRepFields) ------\nMsgType: 13 - KRB_TGS_REP\nPVNO: 5\nCRealm: EXAMPLE.COM\nCName: 1 - host/red01.example.com\nPAData:\n\t(0) Type: 136 - PA-FX-FAST\n\t(0) Data: oIHYMIHVoIHSMIHPoAMCARKigccEgcSRTUJ+LSlxSZBgdknjn0edc4Mnp+Zg65h1qqVWHQNb+8MGfIEdZEiVWzbj+/QbMdETbWTYZCeDV7exIZbPOuNpfDkRmADS3Wq1/sMZ5JDHmtD3f7CctFy3RRNVPhDNyPpsPFIelYnK7vULRGurVVv4KfVFDZsr2vF33a3LP54MrE+PnCKn3KOUoart5p6khBSRZZyltUjladINQIsd28J8Y9zn+L/npjJolDurhvgUb+goxqQBFYBc1KkZ3VwGTNqV08XB\n\t(0) Data len: 219\nTicket:\n\tTktVNO: 5\n\tRealm: EXAMPLE.COM\n\tSName Type: 2\n\tSName String: ldap/ds01.example.com\n\tEncPart:\n\t\tKVNO: 1\n\t\tEType: 18\n\t\tCipher len: 1145\n\tDecryptedEncPart:\n\t\tCRealm: EXAMPLE.COM\n\t\tCName: 1 - host/red01.example.com\n\t\tAuthTime: 2026-03-06 22:15:05 +0000 UTC\n\t\tStartTime: \n\t\tEndTime: 2026-03-07 06:15:05 +0000 UTC\n\t\tRenewTill: \n\t\tCAddr:\n\t\tTransited.TRType: 1\n\t\tTransited.Contents len: 0\n\t\tFlags: 00280000 - PRE-AUTHENT(10),TRANSITED-POLICY-CHECKED(12),\n\t\tAuthorizationData:\n\t\t\t(0) type: 1, len: 926\n\t\tKey: type:18, len:32\nEncPart:\n\tKVNO: 0\n\tEType: 18\n\tCipher len: 216\nDecryptedEncPart:\n\tSRealm: EXAMPLE.COM\n\tSName: 3 - ldap/ds01.example.com\n\tCAddr:\n\tFlags: 00280000 - PRE-AUTHENT(10),TRANSITED-POLICY-CHECKED(12),\n\tNonce: 42476314\n\tPAData:\n\tAuthTime: 2026-03-06 22:15:05 +0000 UTC\n\tStartTime: \n\tEndTime: 2026-03-07 06:15:05 +0000 UTC\n\tRenewTill: \n\tKeyExpiration: \n\tKey: type:18, len:32\n\tLastReqs:\n\t\t(0): 0 - 1970-01-01 00:00:00 +0000 UTC\n------ Message End (KDCRepFields) ------\n","subsystem":"kerberos"}    {"time":"2026-03-07T01:15:05.261230243+03:00","level":"DEBUG","msg":"TCP reply sent","subsystem":"kerberos","bytes":1788,"to":"10.10.0.75:60832"} {"time":"2026-03-07T01:15:05.261230243+03:00","level":"DEBUG","msg":"TCP reply sent","subsystem":"kerberos","bytes":1788,"to":"10.10.0.75:60832", "aaa": {"bbb": "bbbb", "cccc": true}, "ssss":["111", "222"]}';
           this.processClearTerminalData(name, s);
           const s = 'time=2026-04-23T20:28:53.175+03:00 level=INFO msg="Restored InvocationID" subsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22\ntime=2026-04-23T20:28:53.175+03:00 level=INFO msg="Restored InvocationID" subsystem=partitions invocation_id=6e45f782-6ff0-4907-83f1-aca52fe93a22';
           */
           
           /*let s = 'time=2026-04-23T21:14:42.418+03:00 level=DEBUG msg="UDP packet received" subsystem=kerberos bytes=181 from=127.0.0.1:36812\ntime=2026-04-23T21:14:42.419+03:00 level=DEBUG msg="ASExchange start --->" subsystem=kerberos\ntime=2026-04-23T21:14:42.419+03:00 level=DEBUG msg="------ Message start (KDCReqFields) ------\nMsgType: 10 - KRB_AS_REQ\nPVNO: 5\nReneval: false\nPAData:\n\t(0) Type: 150 - PA-AS-FRESHNESS\n\t(0) Data: \n\t(0) Data len: 0\n\t(1) Type: 149 - PA-REQ-ENC-PA-REP\n\t(1) Data: \n\t(1) Data len: 0\nReqBody:\n\tKDCOptions: 00010010 - RESERVED(15),RENEWABLE-OK(27),\n\tRealm: EXAMPLE.COM\n\tCName: 1 - alx\n\tSName: 2 - krbtgt/EXAMPLE.COM\n\tFrom: \n\tTill: 2026-04-24 18:14:42 +0000 UTC\n\tRtime: \n\tNonce: 634064511\n\tEType: 18,17,20,19,16,23,25,26,\n\tAddresses:\n\tAdditionalTickets:\n\tEncAuthData:\n\t\tKVNO: 0\n\t\tEType: 0\n\t\tCipher len: 0\n------ Message End (KDCReqFields) ------\n" subsystem=kerberos\ntime=2026-04-23T21:14:42.419+03:00 level=DEBUG msg=ASRep() subsystem=kerberos sname=krbtgt/EXAMPLE.COM srealm=EXAMPLE.COM cname=alx crealm=EXAMPLE.COM\ntime=2026-04-23T21:14:42.419+03:00 level=DEBUG msg=Preauth() subsystem=kerberos timestamp=<nil>\ntime=2026-04-23T21:14:42.420+03:00 level=DEBUG msg="---> ASExchange end" subsystem=kerberos\ntime=2026-04-23T21:14:42.420+03:00 level=ERROR msg=ASRep subsystem=kerberos errorcode="(6) KDC_ERR_C_PRINCIPAL_UNKNOWN Client not found in Kerberos database" err="GetEncryptionKey(alx/EXAMPLE.COM 0,18) err: searchPrincipalAux(alx@EXAMPLE.COM) err: record not found"';
           this.processClearTerminalData(name, s);

           s = "> directory_server_client@0.0.1 serve\n> npx --no-install vite\n\ncommand is serve mode development\nusing local variables settings\n\nvite v2.3.7 dev server running at:\n\n> Local: http://localhost:3000/\n\n> Network: use `--host` to expose\n\nready in 466ms."
           this.processClearTerminalData(name, s);*/

        } catch (error) {
            this.journal.logError("cant read stream", error)
        }
    }

    //Проверить что терминал подходит
    private isHookTerminal(name: string): boolean {
        const terms = this.cfg.FindTerminalMasks();

        //Все подходят
        if (terms.length == 0) {
            return true;
        }

        //Просмотрим настройки
        name = name.toLowerCase();
        for (let i = 0; i < terms.length; i++) {
            if (name.includes(terms[i])) {
                return true;
            }
        }
        return false;
    }

    //Очистить вывод от мусора
    private cleanTerminalData(data: string): string {
        return data
            // Удаляем ANSI escape последовательности (цвета)
            .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
            // Удаляем последовательности VS Code терминала
            .replace(/\x1B\]633;[^\x07\x1B]*[\x07\x1B\\]/g, '')
            .replace(/\]633;[0-9;]*/g, '')
            // Удаляем все остальные ESC последовательности
            .replace(/\x1B\[[0-9;]*./g, '')
            .replace(/\x1B./g, '')
            // Удаляем управляющие символы, оставляем только печатные + \n \t \r
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
            // Убираем лишние возвраты каретки
            .replace(/\r/g, '');
    }

    private processClearTerminalData(terminalName: string, text: string) {
        //Подготовить список строк для вывода
        let lines: string[] = [];
        try {
            lines = this.lineMgr.parsedata(text, this.cfg.LogType())
        } catch (error) {
            this.journal.logError('cant parse text', error)
            return;
        }
        
        //Отформатируем строки
        for (let i = 0; i < lines.length; i++) {
            try {
                let ftms = this.
                formatter.format(lines[i], this.cfg.LogType());
                this.processTerminal(terminalName, ftms);
            } catch (error) {
                this.journal.logError(`cant format text (${lines[i]})`, error);
                continue;
            }
        }
    }

    private processTerminal(terminalName: string, lines: string[]) {
        if (this.cfg.SingleTerminal()) {
            this.processCommonTerminal(terminalName, lines);
        } else {
            this.processMultiTerminal(terminalName, lines);
        }
    }

    private processCommonTerminal(terminalName: string, lines: string[]) {
        for (let i = 0; i < lines.length; i++) {
            this.commonTerm.writeln(lines[i]);
        }
    }

    private processMultiTerminal(terminalName: string, lines: string[]) {
        //Поищем терминал в списке, если не нашли, то создадим
        let term = this.multiTerms.get(terminalName);
        if (term == null) {
            //Создадим и покажем терминал
            const title = vscode.l10n.t("Echo terminal (%s)").replace('%s', terminalName);
            term = new etterm.EchoTerminal(title, this.cfg.InitialDelay());
            term.Show();

            //Добавим в словарь
            this.multiTerms.set(terminalName, term);
        }
      

        //Выведем строки
        for (let i = 0; i < lines.length; i++) {
            term.writeln(lines[i]);
        }
    }
}