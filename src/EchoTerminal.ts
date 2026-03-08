import * as vscode from 'vscode'
import * as osutils from './osutils'

export class EchoTerminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    private terminal?: vscode.Terminal;
    private isVisible: boolean = false;
    private name: string = "";
    private eol: string = osutils.EOL();


    constructor(aname: string) {
        this.name = aname;
    }

    public dispose() {
        this.writeEmitter.dispose();
        this.hide();
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

        this.isVisible = true;
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
        this.writeEmitter.fire(text);
    }

    public writeln(text: string) {
        this.write(text + this.eol);
    }
}

