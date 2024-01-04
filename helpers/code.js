'use strict';

const TAB = '    ';
const CR = '\r\n';

class CodeLine {

    #codeParts;
    #exclude;

    constructor() {
        this.#codeParts = [];
        this.#exclude = false;
    }

    addCodePart(codePart) { this.#codeParts.push(codePart); }

    addEmptyParts(parts) { for (let i = 0; i < parts; i++) this.#codeParts.push(''); }

    set exclude(exclude) { this.#exclude = exclude; }
    get exclude() { return this.#exclude; }

    get length() { return this.#codeParts.length; }
    
    getPartLength(part) { return (part < this.length) ? this.#codeParts[part].length : undefined; }

    pad(part, len) {
        if (part < this.length) {
            let delta = len - this.#codeParts[part].length;
            if (delta > 0) for (let i = 0; i < delta; i++) this.#codeParts[part] += ' ';
        }
    }
    
    toCode() {
        let code = '';
        for (let part = 0; part < this.length; part++) {
            let c = this.#codeParts[part];
            if (c != '') code += c + ' '; // only pad actual code, ignore empty code parts
        }
        return code;
    }
}

class CodeBlock {

    #codeLines;
    #length;

    constructor() {
        this.#codeLines = [];
        this.#length = 0;
    }

    get codeLines() { return this.#codeLines; }
    get length() { return this.#length; }

    addCodeLine(codeLine) {
        if (this.#codeLines.length == 0) this.#length = codeLine.length; // remember the number of code parts to ensure we can align them
        
        if (codeLine.length == this.#length) this.#codeLines.push(codeLine);
        else throw new Error('Number of code parts in code lines don\'t match: ' + codeLine.toCode());
    }

    addCodeLines(codeLines) { if (Array.isArray(codeLines)) for (let i = 0; i < codeLines.length; i++) this.addCodeLine(codeLines[i]); }

    toCode(indent = '') {
        // determine the max. length of each code part in all lines
        let maxLen = [];
        for (let line = 0; line < this.#codeLines.length; line++) {
            for (let part = 0; part < this.#codeLines[line].length; part++) {
                if ((maxLen[part] == undefined) || (maxLen[part] < this.#codeLines[line].getPartLength(part))) {
                    maxLen[part] = this.#codeLines[line].getPartLength(part);
                }
            }
        }
        // pad each part to the maximum length
        for (let line = 0; line < this.#codeLines.length; line++) {
            for (let part = 0; part < this.#codeLines[line].length; part++) {
                this.#codeLines[line].pad(part, maxLen[part]);
            }
        }
        // create code output
        let code = '';
        for (let line = 0; line < this.#codeLines.length; line++) {
            if (this.#codeLines[line].exclude) code += '// ';
            code += indent + this.#codeLines[line].toCode() + CR;
        }
        return code;
    }
}

module.exports.CR = CR;
module.exports.TAB = TAB;
module.exports.CodeLine = CodeLine;
module.exports.CodeBlock = CodeBlock;