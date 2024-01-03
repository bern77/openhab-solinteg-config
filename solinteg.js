'use strict';

function updateStringItem(itemName, index, char) {
    let item = items.getItem(itemName);
    let stateArr = item.state.split('');
    stateArr[index] = char;
    item.postUpdate(stateArr.join(''));
}

// #1 | Device Serial Number
for (let i = 1; i <= 16; i++) {
    rules.JSRule({
        name: `Solinteg Device SN: monitor character ${i}`,
        triggers: [ trigger.ItemStateUpdateTrigger('PV_Device_SN_' + (i < 10 ? '0' : '') + String(i)) ],
        execute: data => { updateStringItem('PV_Device_SN', i - 1, data.newState); }
    });
}

// #2 | Device Model Info
rules.JSRule({
    name: 'Solinteg Device Model Info',
    triggers: [
        trigger.ItemStateUpdateTrigger('PV_Inverter_Type'),
        trigger.ItemStateUpdateTrigger('PV_Model_Info'),
    ],
    execute: data => {
        const models = [];
        models[30] = ['MHT-4K-25', 'MHT-5K-25', 'MHT-6K-25', 'MHT-8K-25', 'MHT-10K-25', 'MHT-12K-25', 'MHT-10K-40', 'MHT-12K-40', 'MHT-15K-40', 'MHT-20K-40'];
        models[31] = ['MHS-3K-30D', 'MHS-3.6K-30D', 'MHS-4.2K-30D', 'MHS-4.6K-30D', 'MHS-5K-30D', 'MHS-6K-30D', 'MHS-7K-30D', 'MHS-3K-30S', 'MHS-3.6K-30S'];
        models[32] = ['MHT-25K-100', 'MHT-30K-100', 'MHT-36K-100', 'MHT-40K-100', 'MHT-50K-100'];
        models[40] = ['MRT-4K-25', 'MRT-5K-25', 'MRT-6K-25', 'MRT-8K-25', 'MRT-10K-25', 'MRT-12K-25', 'MRT-10K-40', 'MRT-12K-40', 'MRT-15K-40', 'MRT-20K-40'];
        models[41] = ['MRS-3K-30', 'MRS-3.6K-30', 'MRS-4.2K-30', 'MRS-4.6K-30', 'MRS-5K-30', 'MRS-6K-30', 'MRS-7K-30', 'MRS-8K-30'];
        models[42] = ['MRT-25K-100', 'MRT-30K-100', 'MRT-36K-100', 'MRT-40K-100', 'MRT-50K-100'];

        let inverterType = parseInt(data.itemName == 'PV_Inverter_Type' ? data.newState : items.getItem('PV_Inverter_Type').state);
        let modelInfo = parseInt(data.itemName == 'PV_Model_Info' ? data.newState : items.getItem('PV_Model_Info').state);
                
        items.getItem('PV_Device_Model_Info').postUpdate(models[inverterType][modelInfo]);
    }
});

// #3 | Firmware Version
for (let i = 1; i <= 4; i++) {
    rules.JSRule({
        name: `Solinteg Firmware Version: monitor byte ${i}`,
        triggers: [ trigger.ItemStateUpdateTrigger('PV_FW_Ver_1' + String(i)) ],
        execute: data => { updateStringItem('PV_Firmware_Version', i - 1, data.newState); }
    });
}

// #4 - #6 | Date and Time
rules.JSRule({
    name: 'Solinteg Date+Time',
    triggers: [
        trigger.ItemStateUpdateTrigger('PV_DateTime_Y'),
        trigger.ItemStateUpdateTrigger('PV_DateTime_M'),
        trigger.ItemStateUpdateTrigger('PV_DateTime_D'),
        trigger.ItemStateUpdateTrigger('PV_DateTime_h'),
        trigger.ItemStateUpdateTrigger('PV_DateTime_m'),
        trigger.ItemStateUpdateTrigger('PV_DateTime_s')
    ],
    execute: data => {
        function getVal(itemName) { return parseInt(data.itemName == itemName ? data.newState : items.getItem(itemName).state); }
        let date = time.ZonedDateTime.of(getVal('PV_DateTime_Y'), getVal('PV_DateTime_M'), getVal('PV_DateTime_D'),
            getVal('PV_DateTime_h'), getVal('PV_DateTime_m'), getVal('PV_DateTime_s'), 0, time.ZoneId.of('Europe/Vienna'));
        items.getItem('PV_DateTime').postUpdate(date);
    }
});






