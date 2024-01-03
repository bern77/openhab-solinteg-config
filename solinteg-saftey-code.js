(function(i) {
    const codes = [];
    codes[0]  = 'Disable Setting';
    codes[1]  = 'Disable Setting';
    codes[2]  = 'Disable Setting';
    codes[3]  = 'Disable Setting';
    codes[4]  = 'Customized code 1'; // Domestic users can customize the extend of the protection limitation, so that the inverter can be connected to the grid
    codes[6]  = 'Customized code 2'; // Domestic users can customize the extend of the protection limitation, so that the inverter can be connected to the grid
    codes[10] = '50Hz Default'; // Overseas users can customize the extend of the protection limitation, so that the inverter can be connected to the grid
    codes[11] = '60Hz Default'; // Overseas users can customize the extend of the protection limitation, so that the inverter can be connected to the grid
    codes[12] = 'VDE4105'; // German safety code, can be also used by some other countries/regions.
    codes[13] = 'AS4777.2(A)'; // Australia safety code
    codes[14] = 'AS4777.2(NZ)'; // New Zealand safety code
    codes[16] = 'EN50549'; // European safety code
    codes[18] = 'IEC61727(50Hz)'; // IEC standards apply to 50Hz power grids in India, Southeast Asia, the Middle East and parts of Africa
    codes[19] = 'IEC61727(60Hz)'; // IEC standards apply to 60Hz power grids in India, Southeast Asia, the Middle East and parts of Africa
    codes[24] = 'Italy'; // Italy safety code
    codes[25] = 'Czech(A1)'; // Czech safety code
    codes[26] = 'Czech(A2)'; // Czech safety code
    codes[29] = 'EN50549(PL)'; // Poland safety code
    codes[31] = 'Belgium'; // Belgium safety code，C10/11
    codes[35] = 'VDE0126'; // Greece VDE0126-1-1
    codes[36] = 'Italy(MV)'; // ItalyCEI 0-16
    codes[37] = 'South Africa'; // South AfricaNRS 097-2-1
    codes[40] = 'G98'; // England
    codes[41] = 'G99'; // England
    codes[42] = 'Austria'; // Austria TOR Erzeuger
    codes[46] = 'AS4777.2(B)'; // Australia
    codes[47] = 'ES:UNE217002'; // Spain
    codes[48] = 'AS4777.2(C)'; // Australia
    codes[49] = 'ES:NTS631'; // Spain

    try {
        return codes[parseInt(i)];
    } catch (e) {
        return '-';
    }
})(input)
