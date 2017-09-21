const vscode = require('vscode');
const lineColumn = require("line-column");

const { Position } = vscode;
const { settings, editorContext, createFile, capitalizedCamelCase } = require('./utils');


exports.extractComponentToFile = () => editorContext((editor, selection, text, selectedText) => {
    vscode.window.showInputBox({ prompt: 'Insert component name' }).then(input => {
        if (!input) return;
        const fileName = input.toLowerCase();

        createFile(fileName, selectedText, text, err => {
            if (err) return vscode.window.showInformationMessage(err);

            editor.edit(edit => {
                const componentName = capitalizedCamelCase(fileName);
                const importString = `import ${componentName} from '@${settings.componentsFolderLastPath}/${fileName}'\n\n`;

                const start = lineColumn(text).fromIndex(text.indexOf('extends'));
                const line = start && start.line && start.line - 1;

                if (line)
                    edit.insert(new Position(line, 0), importString);

                edit.replace(selection, `<${componentName}/>`)
            }).then(() => {
                vscode.commands.executeCommand('editor.action.formatDocument');
            });
        });
    });
});

exports.extractComponentToFunction = () => editorContext((editor, selection, text, selectedText) => {
    if (!~text.indexOf('render()')) return;
    vscode.window.showInputBox({ prompt: 'Insert component name (render__NAME__)' }).then(input => {
        if (!input) return;
        editor.edit(edit => {
            const functionName = capitalizedCamelCase(input);
            const start = lineColumn(text).fromIndex(text.indexOf('render()'));
            const renderFunctionText = `\n\trender${functionName}(){\nreturn(\n ${selectedText}\n) \n }\n\n`;

            edit.insert(new Position(start.line - 1, start.col - 1), renderFunctionText);
            edit.replace(selection, `\t\t{this.render${functionName}()}`);
            vscode.commands.executeCommand('editor.action.format')
        }).then(() => {
            vscode.commands.executeCommand('editor.action.formatDocument');
        });
    });
});


exports.extractStyle = () => editorContext((editor, selection, text, selectedText) => {
    vscode.window.showInputBox({ prompt: 'Insert name' }).then(input => {
        if (!input) return;
        editor.edit(edit => {
            let row = editor.document.lineCount + 1, stylesText;

            if (!!~text.indexOf('StyleSheet.create')) {
                row = lineColumn(text).fromIndex(text.indexOf('StyleSheet.create')).line;
                stylesText = `${input}: ${selectedText},\n`;
            }
            else {
                stylesText = `\n\nconst styles = StyleSheet.create({\n${input}: ${selectedText},\n})`;
            }

            edit.replace(selection, `styles.${input}`);
            edit.insert(new Position(row, 0), stylesText);
            vscode.commands.executeCommand('editor.action.format')
        }).then(() => {
            vscode.commands.executeCommand('editor.action.formatDocument');
        });
    });
});


exports.embedComponent = () => editorContext((editor, selection, text, selectedText) => {
    vscode.window.showInputBox({ prompt: 'Insert component name' }).then(input => {
        if (!input) return;
        editor.edit(edit => {
            edit.replace(selection, `<${input}>\n${selectedText}\n</${input}>`);
            vscode.commands.executeCommand('editor.action.format');
        }).then(() => {
            vscode.commands.executeCommand('editor.action.formatDocument');
        });
    });
});
