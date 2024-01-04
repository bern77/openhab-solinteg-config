(function(i) {
    let brand = parseInt(items.getItem('PV_Batt_Conf').state);
    let conf = parseInt(i);
    switch (brand) {
        case 1: // Solinteg
            if ((conf == 0) || (conf == 1)) return 'N/A';
            else if (conf == 2) return 'EBS-5150';
        case 2: // EMS
            return 'EMS_HV';
        case 3: // Default
            return conf ? 'Default HV_1' : 'No Battery';
        case 4: // n/a
        case 5: // n/a
        case 6: // n/a
        case 7: // n/a
        case 8: // n/a
        case 9: // n/a
            return 'N/A';
        case 10: // Wattsonic Li-HV
            return 'WattLi_HH';
        case 11: // AOBOET
            return 'Aobo_ET';
        case 12: // DYNESS
            return 'Dyness';
        case 13: // Pylon
            return 'Pylon_HV';
        case 14: // Soluna
            return 'Soluna_HV';
        case 15: // n/a
            return 'N/A';
        case 16: // WECO
            return 'WeCo_HV';
        case 17: // n/a
            return 'N/A';
        case 18: // Jingkong
            return 'Mint-JKE';
        default:
            return 'N/A';
    }
})(input)
