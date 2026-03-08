import * as vscode from 'vscode'
import * as osutils from './osutils'

export class EchoTerminalJournal {
    private out: vscode.LogOutputChannel;
    private name = vscode.l10n.t("Echo terminal");
    private eol: string = osutils.EOL();

    constructor(context: vscode.ExtensionContext) {
        this.out = vscode.window.createOutputChannel(this.name, {log: true});
        context.subscriptions.push(this.out);
    }

    public dispose(): void {
        this.out.dispose();
    }

    public show(): void {
        this.out.show();
    }

    public hide(): void {
        this.out.hide();
    }

    public clear(): void {
        this.out.clear();
    }

    public logInfo(message: string) {
        this.out.info(message);
    }

    public logError(message: string, error?: unknown) {
        this.out.error(message, error);
    }
}


