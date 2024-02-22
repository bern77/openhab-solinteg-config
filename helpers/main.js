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
    table: 1, // A
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
    refresh: 15, // O
    exclude: 16, // P
    icon: 17, // Q
    sitemap: 18 // R
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
    let lastTable = null;
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
                } else if ((lastTable != row.getCell(COLS.table).value) || (dataObj.startAddress > lastAddr + 1)) { // separate table or progress in address > 1 register => we need a now poller
                    registerTable.addContinuousRegister(poller);
                    poller = new ContinuousRegisters(dataObj.type);
                }
                poller.addDataObject(dataObj);
                lastAddr = dataObj.startAddress;

                let refresh = row.getCell(COLS.refresh).value;
                if ((refresh !== null) && (refresh.result !== undefined)) refresh = refresh.result;
                if ((refresh !== null) && (refresh != '')) {
                    refresh = parseInt(refresh);
                    if ((poller.refresh === undefined) || (refresh < poller.refresh)) poller.refresh = refresh;
                }
            }
            lastNo = row.getCell(COLS.no).value;
            lastTable = row.getCell(COLS.table).value;
        }
    }

    // output the code
    let manualPart = fs.readFileSync(PATH_MANUAL + FILENAME_THINGS, 'utf8');
    fs.writeFileSync(PATH_GENERATED + 'things/' + FILENAME_THINGS, registerTable.toThingsCode() + manualPart.split('///////')[1]);
    
    manualPart = fs.readFileSync(PATH_MANUAL + FILENAME_ITEMS, 'utf8');
    fs.writeFileSync(PATH_GENERATED + 'items/' + FILENAME_ITEMS, manualPart + registerTable.toItemsCode());
    
    fs.writeFileSync(PATH_GENERATED + 'sitemaps/' + FILENAME_SITEMAP, registerTable.toSitemapCode());
});
