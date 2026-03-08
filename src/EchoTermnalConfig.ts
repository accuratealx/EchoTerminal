import * as vscode from "vscode"

export class EchoTermnalConfig {

    enable: boolean = true;
    singleTerminal: boolean = true;
    logType: string = "";
    findTerminalMasks: string[] = [];

    constructor() {
        this.Reload();
    }

    public dispose() {}

    //Прочитать конфиг
    public Reload(): void {
        const config = vscode.workspace.getConfiguration('EchoTerminal');

        this.enable = config.get<boolean>('Enabled', true);
        this.singleTerminal = config.get<boolean>('SingleTerminal', true);
        this.logType = config.get<string>('LogType', "slog");

        //Подготовим список масок для поиска по имени терминала
        let s = config.get<string>('FindTerminalMask', '').trim();
        const parts = s.split(",")
        for (let i = 0; i < parts.length; i++) {
            const s = parts[i].trim().toLowerCase();
            if (s.length != 0) {
                this.findTerminalMasks.push(s);
            }
        }
    }

    public Enable(): boolean {
        return this.enable;
    }

    public SingleTerminal(): boolean {
        return this.singleTerminal;
    }

    public FindTerminalMasks(): string[] {
        return this.findTerminalMasks;
    }

    public LogType(): string {
        return this.logType;
    }
}
