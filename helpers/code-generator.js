'use strict';

const {CR, TAB, CodeLine, CodeBlock} = require('./code');
const {MANUAL_DATA} = require('../manual/sitemap');

const MODBUS_TYPE = 'tcp';
const BRIDGE_NAME = 'inverter';
const BRIDGE_DESCRIPTION = 'Solinteg Inverter';
const LOCATION = 'TR';
const IP_ADDR = '192.168.30.10';
const PORT = 502;
const ID = 2;

class RegisterTable {

    #continuousRegisters;
    #dataObjects;

    constructor() {
        this.#continuousRegisters = [];
        this.#dataObjects = [];
    }

    addContinuousRegister(reg) { this.#continuousRegisters.push(reg); }

    addDataObject(dataObj) { this.#dataObjects.push(dataObj); }

    toThingsCode() {
        let code = `Bridge modbus:${MODBUS_TYPE}:${BRIDGE_NAME} "${BRIDGE_DESCRIPTION}" @ "${LOCATION}" [ host="${IP_ADDR}", port=${PORT}, ID=${ID} ] {` + CR + CR;
        for (let i = 0; i < this.#continuousRegisters.length; i++) code += this.#continuousRegisters[i].toThingsCode();
        //code += '}';
        return code;
    }

    toItemsCode() {
        let code = new CodeBlock();
        for (let i = 0; i < this.#continuousRegisters.length; i++) code.addCodeLines(this.#continuousRegisters[i].toItemsCodeLines());
        return code.toCode();
    }

    toSitemapCode() {
        // build list of groups and data objects
        let sitemap = [];
        for (let i = 0; i < this.#dataObjects.length; i++) {
            let d = this.#dataObjects[i];
            if (!(d.sitemap in sitemap)) sitemap[d.sitemap] = [];
            sitemap[d.sitemap].push(d.getItemName());
        }
        // add manually defined items
        for (let i = 0; i < MANUAL_DATA.length; i++) {
            if (!(MANUAL_DATA[i].sitemap in sitemap)) sitemap[MANUAL_DATA[i].sitemap] = [];
            sitemap[MANUAL_DATA[i].sitemap].push(MANUAL_DATA[i].item);
        }
        // create the code
        let code = 'sitemap solinteg label="Solinteg" {' + CR + CR;
        for (let group in sitemap) {
            code += TAB + `Frame label="${group}" {` + CR;
            for (let i = 0; i < sitemap[group].length; i++) {
                code += TAB + TAB + 'Text item=' + sitemap[group][i] + CR;
            }
            code += TAB + '}' + CR + CR;
        }
        code += '}';
        return code;
    }

    static get REG_TYPE_RO() { return 'ro'; }
    static get REG_TYPE_RW() { return 'rw'; }
    static get REG_TYPE_WO() { return 'wo'; }

    static getRegType(t) {
        // RO -> ro
        // RW -> rw
        // WO -> wo
        return t.toLowerCase();
    }

    static getDataType(t) {
        switch (t) {
            case 'U16':
                return 'uint16';
            case 'U32':
                return 'uint32';
            case 'I16':
                return 'int16';
            case 'I32':
                return 'int32';
            case 'STR':
            default:
                return 'TODO';
        }
    }
}


class ContinuousRegisters {

    #type;
    #length;
    #dataObjects;
    #codeBlock;

    constructor(type, length = 0) {
        this.#type = type;
        this.#length = length;
        this.#dataObjects = [];
        this.#codeBlock = new CodeBlock();
    }

    set length(length) { this.#length = length; }
    get length() { return this.#length; }
    incLength() { this.#length++; }

    get dataObjects() { return this.#dataObjects; }

    addDataObject(dataObject) {
        this.#dataObjects.push(dataObject);
        this.#codeBlock.addCodeLine(dataObject.toThingCodeLine());
        this.incLength();
    }

    get startAddress() {
        if (this.#dataObjects.length > 0) return this.#dataObjects[0].startAddress
        else throw new Error('No data objects in continuous register');
    }

    get pollerID() { return this.#type + this.startAddress; }

    toThingsCode() {
        let code = TAB + `Bridge poller ${this.pollerID} [ start=${this.startAddress}, length=${this.#length}, type="holding" ] {` + CR;
        code += this.#codeBlock.toCode(TAB + TAB);
        code += TAB + '}' + CR + CR;
        return code;
    }

    toItemsCodeLines() {
        let code = [];
        for (let i = 0; i < this.#dataObjects.length; i++) code.push(this.#dataObjects[i].toItemCodeLine(this.pollerID));
        return code;
    }
}

class ItemType {

    #type;
    #uom;

    constructor(type, uom = undefined) {
        this.#type = type;
        this.#uom = uom;
    }

    static get NUMBER() { return 'Number'; }
    static get SWITCH() { return 'Switch'; }
    // TODO: for a wider usage this should be extended

    static get UOM_DIMENSIONLESS() { return 'Dimensionless'; }
    static get UOM_TEMPERATURE() { return 'Temperature'; }
    static get UOM_ELECTRIC_CURRENT() { return 'ElectricCurrent'; }
    static get UOM_TIME() { return 'Time'; }
    static get UOM_FREQUENCY() { return 'Frequency'; }
    static get UOM_POWER() { return 'Power'; }
    static get UOM_ENERGY() { return 'Energy'; }
    static get UOM_ELECTRIC_POTENTIAL() { return 'ElectricPotential'; }

    toString() { return this.#type + (this.#uom !== undefined ? ':' + this.#uom : ''); }

    get type() { return this.#type; }
    get uom() { return this.#uom; }

    get isNumeric() { return this.#type == ItemType.NUMBER; }

    get unit() {
        switch (this.#uom) {
            case ItemType.UOM_ELECTRIC_POTENTIAL:
                return 'Voltage';
            case ItemType.UOM_ELECTRIC_CURRENT:
                return 'Current';
            case undefined:
                return '';
            default:
                return this.#uom;
        }
    }

    get channel() { return this.isNumeric ? 'number' : 'switch'; }

}

class DataObject {

    #type
    #startAddress;
    #description;
    #dataType;
    #uom;
    #accuracy;
    #note;
    #itemType;
    #transformation;
    #exclude;
    #icon;
    #group;
    #sitemap;

    constructor(type, startAddress, description, dataType, uom = undefined, accuracy = undefined, note = undefined,
            itemType = undefined, transformation = undefined, exclude = false, icon = undefined, group = undefined, sitemap = undefined) {
        this.#type = type;
        this.#startAddress = startAddress;
        this.#description = description;
        this.#dataType = dataType;
        this.#uom = uom;
        this.#accuracy = accuracy;
        this.#note = note;
        this.#itemType = (itemType !== undefined) && (itemType !== null) ? new ItemType(itemType) : undefined;
        this.#transformation = transformation;
        this.#exclude = exclude;
        this.#icon = icon;
        this.#group = group;
        this.#sitemap = sitemap;
        // ensure numeric values
        function setNumeric(field) { try { field = parseInt(field) } catch (e) { error.log('Data was not numeric.'); } }
        setNumeric(this.#startAddress);
        setNumeric(this.#accuracy);
    }

    get type() { return this.#type; }
    get startAddress() { return this.#startAddress; }
    get description() { return this.#description; }
    get dataType() { return this.#dataType; }
    get uom() { return this.#uom; }
    get accuracy() { return this.#accuracy; }
    get note() { return this.#note; }
    get sitemap() { return this.#sitemap; }

    _getThingID() { return 'do' + this.#startAddress; }

    toThingCodeLine() {
        let cl = new CodeLine();
        cl.addCodePart(`Thing data ${this._getThingID()} "${this.#description}"`);
        cl.addCodePart(`[`);
        if ((this.type == RegisterTable.REG_TYPE_RO) || (this.type == RegisterTable.REG_TYPE_RW)) {
            cl.addCodePart(`readValueType="${this.#dataType}",`);
            cl.addCodePart(`readStart=${this.#startAddress}` + (this.type != RegisterTable.REG_TYPE_RO ? ',' : ''));
        } else {
            cl.addEmptyParts(2);
        }
        if ((this.type == RegisterTable.REG_TYPE_RW) || (this.type == RegisterTable.REG_TYPE_WO)) {
            cl.addCodePart(`writeValueType="${this.#dataType}",`);
            cl.addCodePart(`writeStart=${this.#startAddress},`);
            cl.addCodePart('writeType="holding"');
        } else {
            cl.addEmptyParts(3);
        }
        cl.addCodePart(']');
        let comment = '';
        if ((this.uom !== undefined) || (this.accuracy !== undefined) || (this.note !== undefined)) {
            comment = ' // ';
            if (this.uom != 'N/A') comment += `unit: ${this.uom}, accuracy: ${this.accuracy}`;
            if ((this.note !== undefined) && (this.note !== null)) {
                if (comment.length > 4) comment += ', ';
                comment += String(this.note).replaceAll(/\n/gi, ', ');
                // let note = ;
                // note = note.replace('\n', ', ');
                // note = note.replace('\r\n', ', ');
                // comment += note;
            }
        }
        cl.addCodePart(comment);
        return cl;
    }

    _getItemType() {
        if (this.#itemType === undefined) {
            switch (this.#uom) {
                case 'Prd':
                case '%':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_DIMENSIONLESS);
                    break;
                case '°C':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_TEMPERATURE);
                    break;
                case 'A':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_ELECTRIC_CURRENT);
                    break;
                case 'H':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_TIME);
                    break;
                case 'Hz':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_FREQUENCY);
                    break;
                case 'kVA':
                case 'kW':
                case 'W':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_POWER);
                    break;
                case 'kWh':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_ENERGY);
                    break;
                case 'V':
                    this.#itemType = new ItemType(ItemType.NUMBER, ItemType.UOM_ELECTRIC_POTENTIAL);
                    break;
                case 'N/A':
                case 'N/A ':
                case 'NA':
                case ' ':
                case '':
                default:
                    this.#itemType = new ItemType(ItemType.NUMBER);
                    this.#uom = undefined;
                    break;
            }
        }
        return this.#itemType.toString();
    }

    getItemName() {
        // return this.#description.replace(/ /gi, '_');
        return `PV_DO${this.#startAddress}`;
    }

    _getTransformation() {
        if ((this.#transformation !== undefined) && (this.#transformation !== null)) {
            let type = this.#transformation.split('.')[1];
            return `[${type.toUpperCase()}(${this.#transformation}):%s]`;
        } else return undefined;
    }

    _getNoOfDigts() { return String(this.#accuracy).length - 1; }

    _getItemDescription() {
        let d = '"' + this.#description;
        if ((this.#transformation !== undefined) && (this.#transformation !== null)) d += ' ' + this._getTransformation();
        else if (this.#itemType.isNumeric) d += ` [%.${this._getNoOfDigts()}f %unit%]`;
        d += '"';
        return d;
    }

    _getSemanticTags() {
        let tags = [];
        if (this.#itemType.uom !== undefined) {
            tags.push(this.#type == RegisterTable.REG_TYPE_RO ? 'Measurement' : 'Setpoint');
            tags.push(this.#itemType.unit);
        } else {
            tags.push('Status');
        }
        return tags;
    }

    toItemCodeLine(pollerID) {
        let cl = new CodeLine();
        // type
        cl.addCodePart(this._getItemType());
        // name
        cl.addCodePart(this.getItemName());
        // description
        cl.addCodePart(this._getItemDescription());
        // icon
        cl.addCodePart('<' + ((this.#icon !== undefined) && (this.#icon !== null) ? this.#icon : 'energy') + '>');
        // group
        cl.addCodePart((this.#group !== undefined) && (this.#group !== null) ? `(${this.#group})` : '');
        // semantic tags
        let tags = this._getSemanticTags();
        if (tags.length > 0) {
            let tag1 = '["' + tags[0] + '"';
            let tag2 = '';
            if (tags.length == 2) {
                tag1 += ',';
                tag2 = '"' + tags[1] + '"]';
            } else {
                tag1 += ']';
            }
            cl.addCodePart(tag1);
            cl.addCodePart(tag2);
        } else {
            cl.addEmptyParts(2);
        }
        // unit
        cl.addCodePart(this.#uom != undefined ? `{unit="${this.#uom}",` : '{');
        // channel
        let channel = `channel="modbus:data:${BRIDGE_NAME}:${pollerID}:${this._getThingID()}:${this.#itemType.channel}"`;
        if (this.#accuracy > 1) {
            channel += '[profile="modbus:gainOffset",';
            cl.addCodePart(channel);
            let gain = 'gain="0.';
            for (let i = 0; i < this._getNoOfDigts(); i++) gain += '0';
            gain += '1",';
            cl.addCodePart(gain);
            cl.addCodePart('pre-gain-offset="0"]}');
        } else {
            cl.addCodePart(channel + '}');
            cl.addEmptyParts(2);
        }
        // exclude
        cl.exclude = this.#exclude;

        return cl;
    }
}

module.exports.RegisterTable = RegisterTable;
module.exports.ContinuousRegisters = ContinuousRegisters;
module.exports.DataObject = DataObject;
