const vscode = require('vscode');
const lineColumn = require("line-column");

const { Position } = vscode;
const { settings, editorContext, createFile, capitalizedCamelCase } = require('./utils');


const extractComponentToFile = () => editorContext((editor, selection, text, selectedText) => {
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

                edit.replace(selection, `<${componentName}/>`);
            });
        });
    });
});

const extractComponentToFunction = () => {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var selection = editor.selection;
    var original = editor.document.getText()
    var text = editor.document.getText(selection)
    let actEdit = vscode.window.activeTextEditor
    let rowInsert = 0
    let column = 0
    if (original.indexOf('render()') > -1) {
        const start = lineColumn(original).fromIndex(original.indexOf('render()'))
        rowInsert = start.line - 1
        column = start.column
    } else {
        return
    }

    vscode.window.showInputBox({
        prompt: 'Insert name method (render__NAME__)',
        value: ''
    }).then(function (e) {
        if (!e || e == '') return

        const nameMethod = capitalizedCamelCase(e)
        actEdit.edit(function (edit) {
            const Position = vscode.Position
            const newtext = `\n\trender${nameMethod}(){\nreturn(\n ${text}\n) \n }\n\n`

            edit.replace(selection, '\t\t{ this.render' + nameMethod + '() }')
            edit.insert(new Position(rowInsert, column), newtext)
        })
    })
}



function embedComponent() {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var selection = editor.selection;
    var text = editor.document.getText(selection);

    let actEdit = vscode.window.activeTextEditor;

    vscode.window.showInputBox({
        prompt: 'Insert component name',
        value: 'View'
    }).then(function (e) {

        if (!e || e == '') return
        actEdit.edit(function (edit) {
            edit.replace(selection, '<' + e + '>\n' + text + '\n</' + e + '>')
        })
    })

}

function extractStyle() {

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var selection = editor.selection;
    var original = editor.document.getText()
    var text = editor.document.getText(selection)
    let actEdit = vscode.window.activeTextEditor

    let newStyle = true
    let rowInsert = actEdit.document.lineCount + 1

    if (original.indexOf('StyleSheet.create') > -1) {
        const start = lineColumn(original).fromIndex(original.indexOf('StyleSheet.create'))
        //const end = start.toIndex(0, original.indexOf('})'))
        rowInsert = start.line
        newStyle = false
    }

    vscode.window.showInputBox({
        prompt: 'Insert name',
        value: ''
    }).then(function (e) {
        if (!e || e == '') return

        actEdit.edit(function (edit) {
            const Position = vscode.Position
            let stylesText = ''

            if (newStyle)
                stylesText = `\n\nconst styles = StyleSheet.create({ \n ${e}:${text} \n}) `
            else
                stylesText = `${e}:${text},\n`


            edit.replace(selection, `styles.${e}`)
            edit.insert(new Position(rowInsert, 0), stylesText);
        })
    })

}


exports.componentToFile = extractComponentToFile;
exports.componentToFunction = extractComponentToFunction;

exports.style = extractStyle;

exports.embed = embedComponent;
