'use strict';

function updateStringItem(itemName, index, char) {
    let item = items.getItem(itemName);
    let stateArr = item.state.split('');
    stateArr[index] = char;
    item.postUpdate(stateArr.join(''));
}

function padInt(i) { return (i < 10 ? '0' : '') + String(i); }

// Device Serial Number
for (let i = 1; i <= 16; i++) {
    rules.JSRule({
        name: `Solinteg Device SN: monitor character ${i}`,
        triggers: [ triggers.ItemStateUpdateTrigger('PV_Device_SN_' + padInt(i)) ],
        execute: data => { updateStringItem('PV_Device_SN', i - 1, String.fromCharCode(parseInt(data.receivedState))); }
    });
}

// Device Model Info
rules.JSRule({
    name: 'Solinteg Device Model Info',
    triggers: [
        triggers.ItemStateUpdateTrigger('PV_Inverter_Type'),
        triggers.ItemStateUpdateTrigger('PV_Model_Info'),
    ],
    execute: data => {
        const models = [];
        models[30] = ['MHT-4K-25', 'MHT-5K-25', 'MHT-6K-25', 'MHT-8K-25', 'MHT-10K-25', 'MHT-12K-25', 'MHT-10K-40', 'MHT-12K-40', 'MHT-15K-40', 'MHT-20K-40'];
        models[31] = ['MHS-3K-30D', 'MHS-3.6K-30D', 'MHS-4.2K-30D', 'MHS-4.6K-30D', 'MHS-5K-30D', 'MHS-6K-30D', 'MHS-7K-30D', 'MHS-3K-30S', 'MHS-3.6K-30S'];
        models[32] = ['MHT-25K-100', 'MHT-30K-100', 'MHT-36K-100', 'MHT-40K-100', 'MHT-50K-100'];
        models[40] = ['MRT-4K-25', 'MRT-5K-25', 'MRT-6K-25', 'MRT-8K-25', 'MRT-10K-25', 'MRT-12K-25', 'MRT-10K-40', 'MRT-12K-40', 'MRT-15K-40', 'MRT-20K-40'];
        models[41] = ['MRS-3K-30', 'MRS-3.6K-30', 'MRS-4.2K-30', 'MRS-4.6K-30', 'MRS-5K-30', 'MRS-6K-30', 'MRS-7K-30', 'MRS-8K-30'];
        models[42] = ['MRT-25K-100', 'MRT-30K-100', 'MRT-36K-100', 'MRT-40K-100', 'MRT-50K-100'];

        let inverterType = parseInt(data.itemName == 'PV_Inverter_Type' ? data.receivedState : items.getItem('PV_Inverter_Type').state);
        let modelInfo = parseInt(data.itemName == 'PV_Model_Info' ? data.receivedState : items.getItem('PV_Model_Info').state);
                
        items.getItem('PV_Device_Model_Info').postUpdate(models[modelInfo][inverterType]);
    }
});

// Firmware Version
for (let i = 1; i <= 4; i++) {
    rules.JSRule({
        name: `Solinteg Firmware Version: monitor byte ${i}`,
        triggers: [ triggers.ItemStateUpdateTrigger('PV_FW_Ver_' + String(i)) ],
        execute: data => { updateStringItem('PV_Firmware_Version', i - 1, data.receivedState); }
    });
}

// Date and Time
rules.JSRule({
    name: 'Solinteg Date+Time',
    triggers: [
        triggers.ItemStateUpdateTrigger('PV_DateTime_Y'),
        triggers.ItemStateUpdateTrigger('PV_DateTime_M'),
        triggers.ItemStateUpdateTrigger('PV_DateTime_D'),
        triggers.ItemStateUpdateTrigger('PV_DateTime_h'),
        triggers.ItemStateUpdateTrigger('PV_DateTime_m'),
        triggers.ItemStateUpdateTrigger('PV_DateTime_s')
    ],
    execute: data => {
        function getVal(itemName) { return parseInt(data.itemName == itemName ? data.receivedState : items.getItem(itemName).state); }
        let date = time.ZonedDateTime.of(getVal('PV_DateTime_Y') + 2000, getVal('PV_DateTime_M'), getVal('PV_DateTime_D'),
            getVal('PV_DateTime_h'), getVal('PV_DateTime_m'), getVal('PV_DateTime_s'), 0, time.ZoneId.of('Europe/Vienna'));
        items.getItem('PV_DateTime').postUpdate(date.toLocalDateTime().toString());
    }
});

// Period Start/Stop Times
const startStop = ['Start', 'Stop'];

function getItemName(p, s, t = undefined) {
    let itemName = 'PV_Period_' + p + '_' + startStop[s];
    if (t !== undefined) itemName += '_' + t;
    return itemName;
}

for (let p = 1; p <= 6; p++) {
    for (let s = 0; s <= 1; s++) {
        // read from device
        rules.JSRule({
            name: `Solinteg Battery: read ${startStop[s]} time for period ${p}`,
            triggers: [ triggers.ItemStateUpdateTrigger(getItemName(p, s)) ],
            execute: data => {
                let n = parseInt(data.receivedState);
                // console.log(((n >> 8) & 0xFF) + ' | ' + (n & 0xFF));
                // items.getItem(`PV_Period_${p}_${startStop[s]}_H`).postUpdate((n >> 8) & 0xFF);
                // items.getItem(`PV_Period_${p}_${startStop[s]}_M`).postUpdate(n & 0xFF);
            }
        });
        // write to device
        rules.JSRule({
            name: `Solinteg Battery: write ${startStop[s]} time for period ${p}`,
            triggers: [
                triggers.ItemCommandTrigger(getItemName(p, s, 'H')),
                triggers.ItemCommandTrigger(getItemName(p, s, 'M'))
            ],
            execute: data => {
                let h = parseInt(data.itemName == getItemName(p, s, 'H') ? data.receivedCommand : items.getItem(getItemName(p, s, 'H')).state);
                let m = parseInt(data.itemName == getItemName(p, s, 'M') ? data.receivedCommand : items.getItem(getItemName(p, s, 'M')).state);
                items.getItem(`PV_Period_${p}_${startStop[s]}`).sendCommand((h << 8) + m);
            }
        });
    }
}

// Total Current Power Consumption
rules.JSRule({
    name: 'Solinteg Total Current Power Consumption',
    triggers: [
        triggers.ItemStateUpdateTrigger('PV_DO11000'), // Pmeter of 3 phases
        triggers.ItemStateUpdateTrigger('PV_DO11028')  // Total PV Input Power
    ],
    execute: data => {
        let grid = parseFloat(data.itemName == 'PV_DO11000' ? data.receivedState : items.getItem('PV_DO11000').state);
        let pv =   parseFloat(data.itemName == 'PV_DO11028' ? data.receivedState : items.getItem('PV_DO11028').state);
        let batt = parseFloat(data.itemName == 'PV_DO30258' ? data.receivedState : items.getItem('PV_DO30258').state);
        items.getItem('PV_Total_Power').postUpdate(`${pv - grid + batt} kW`);
    }
});
