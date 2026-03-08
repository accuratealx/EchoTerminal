import * as vscode from 'vscode';
import * as config from './EchoTermnalConfig'
import * as manager from './EchoTerminalManager'
import * as log from './EchoTerminalJournal'

let cfg: config.EchoTermnalConfig;
let mgr: manager.EchoTerminalManager;
let journal: log.EchoTerminalJournal;

export function activate(context: vscode.ExtensionContext) {
    //Жрнал
    journal = new log.EchoTerminalJournal(context);

    //Конфиг
    cfg = new config.EchoTermnalConfig();
    cfg.Reload();

    //Менеджер терминалов
    mgr = new manager.EchoTerminalManager(cfg, journal);

    //Подписаться на обновление параметров
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('EchoTerminal')) {
            cfg.Reload();
            mgr.updateConfig(cfg);
        }
    })

    //Обработчик всех записей в терминал
    const listener = vscode.window.onDidStartTerminalShellExecution(
        async (e: vscode.TerminalShellExecutionStartEvent) => {
            mgr.handler(e);
        }
    )
    context.subscriptions.push(listener);

    journal.logInfo('Init complete');
}

export function deactivate() {
    cfg.dispose();
    mgr.dispose();
    journal.dispose();
}