import { buffer } from 'node:stream/consumers';
import * as vscode from 'vscode'

export class EchoTerminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    private terminal?: vscode.Terminal;
    private isVisible: boolean = false;
    private name: string = "";
    private disable: boolean = false;
    private initialDelay: number = 1000;

    //TODO: Добавить флаг готовности
    private readyToWrite: boolean = false;
    private linebuffer: Array<string> = new Array<string>();

    constructor(aname: string, initialDelay: number) {
        this.name = aname;
    }

    public dispose() {
        this.writeEmitter.dispose();
        this.hide();
    }

    public Name(): string {
        return this.name;
    }

    public Show() {
        if (!this.terminal) {
            const pty: vscode.Pseudoterminal = {
                onDidWrite: this.writeEmitter.event,
                handleInput: () => {},
                open: () => {},
                close: () => {}
            };

            this.terminal = vscode.window.createTerminal({
                name: this.name,
                pty: pty,
            })
        }

        //Залипон, через 1 секунду вывести буфер который накопился
        setTimeout(() => {
            this.writeLineBuffer();
            this.readyToWrite = true;
        }, this.initialDelay);

        this.isVisible = true;
        this.disable = false;
    }

    public Disable() {
        this.disable = true;
    }

    public GetDisabled(): boolean {
        return this.disable;
    }

    public hide() {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = undefined;
        }
        this.isVisible = false;
    }

    public visible(): boolean {
        return this.isVisible;
    }

    public write(text: string) {
        //Если терминал не готов, то запишем в буфер
        if (!this.readyToWrite) {
            this.linebuffer.push(text);
            return;
        }

        //Иначе сразу в терминал
        this.writeEmitter.fire(text);
    }

    public writeln(text: string) {
        this.write(text + '\n\r');
    }

    public SetInitialDelay(delay: number) {
        this.initialDelay = delay;
    }

    private writeLineBuffer() {
        for (let i = 0; i < this.linebuffer.length; i++) {
            const line = this.linebuffer[i];
            this.writeEmitter.fire(line);
        }
        this.linebuffer.length = 0;
    }
}

