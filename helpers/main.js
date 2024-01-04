'use strict';

const exceljs = require('exceljs');
const fs = require('fs');
const {RegisterTable, ContinuousRegisters, DataObject} = require('./code-generator');


const EXCEL_FILENAME = './Solinteg Modbus Registers.xlsx';
const FILENAME_THINGS = 'solinteg.things';
const FILENAME_ITEMS = 'solinteg.items';
const FILENAME_SITEMAP = 'solinteg.sitemap';
const PATH_MANUAL = './manual/';
const PATH_GENERATED = './openhab/';

const ROWS = {
    start: 2,
    end: 256
}

const COLS = {
    // C - O
    start: 2,
    end: 17,

    // reference the individual columns:
    no: 2, // B
    addr: 3, // C
    description: 5, // E
    type: 6, // F
    dataType: 7, // G
    uom: 8, // H
    accuracy: 9, // I
    note: 10, // J
    manualDef: 12, // L
    manualItemType: 13, // M
    tranform: 14, // N
    exclude: 15, // O
    icon: 16, // P
    sitemap: 17 // Q
}

const TRIM = false;
const GROUP = 'gPV';

const workbook = new exceljs.Workbook();
workbook.xlsx.readFile(EXCEL_FILENAME).then(() => {
    let regTab = workbook.getWorksheet('Registers');
  
    // trim trailing blanks
    if (TRIM) {
        for (let row = 1; row <= 256; row++) {
            for (let col = 5; col <= 10; col++) {
                let cell = regTab.getRow(row).getCell(col);
                if (cell.value != null) cell.value = String(cell.value).trim();
            }
        }
        workbook.xlsx.writeFile(EXCEL_FILENAME).then(() => { console.log('done'); });
    }

    let registerTable = new RegisterTable(); // the object we want to create from the table's contents

    // helpers required for processing each line
    let poller = null;
    let lastNo = null;
    let lastAddr = null;

    // process the table's lines
    for (let r = ROWS.start; r <= ROWS.end; r++) {
        let row = regTab.getRow(r);
        let manualDef = row.getCell(COLS.manualDef).value == 1;
        let exclude = row.getCell(COLS.exclude).value == 1;
        
        if (!manualDef) { // only process if not flagged as 'manual definition'
            if ((poller !== null) && (lastNo == row.getCell(COLS.no).value)) { // no new data object, just the next register
                poller.incLength();
                lastAddr = row.getCell(COLS.addr).value;
            } else { // new data object
                let manualItemType = row.getCell(COLS.manualItemType).value;
                let dataObj = new DataObject(
                    RegisterTable.getRegType(row.getCell(COLS.type).value),
                    row.getCell(COLS.addr).value,
                    row.getCell(COLS.description).value,
                    RegisterTable.getDataType(row.getCell(COLS.dataType).value),
                    row.getCell(COLS.uom).value,
                    row.getCell(COLS.accuracy).value,
                    row.getCell(COLS.note).value,
                    manualItemType != '' ? manualItemType : undefined,
                    row.getCell(COLS.tranform).value,
                    exclude,
                    row.getCell(COLS.icon).value,
                    GROUP,
                    row.getCell(COLS.sitemap).value,
                );
                registerTable.addDataObject(dataObj);
                if (poller === null) { // first line
                    poller = new ContinuousRegisters(dataObj.type);
                } else if (dataObj.startAddress > lastAddr + 1) { // progress in address > 1 register => we need a now poller
                    registerTable.addContinuousRegister(poller);
                    poller = new ContinuousRegisters(dataObj.type);
                }
                poller.addDataObject(dataObj);
                lastAddr = dataObj.startAddress;
            }
            lastNo = row.getCell(COLS.no).value;
        }
    }

    // output the code
    let manualPart = fs.readFileSync(PATH_MANUAL + FILENAME_THINGS, 'utf8');
    fs.writeFileSync(PATH_GENERATED + 'things/' + FILENAME_THINGS, registerTable.toThingsCode() + manualPart.split('///////')[1]);
    
    manualPart = fs.readFileSync(PATH_MANUAL + FILENAME_ITEMS, 'utf8');
    fs.writeFileSync(PATH_GENERATED + 'items/' + FILENAME_ITEMS, manualPart + registerTable.toItemsCode());
    
    fs.writeFileSync(PATH_GENERATED + 'sitemaps/' + FILENAME_SITEMAP, registerTable.toSitemapCode());
});
