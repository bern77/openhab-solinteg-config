# Configuration to integrate a Solinteg Inverter + Battery into openHAB

The implementation of the Solinteg Inverter Modbus Protocol is based on Register Table version 00.03 (2023-06-26) - see file in repository.

Most <code>Thing</code>, <code>Item</code> and <code>Sitemap</code> definitions are automatically generated based on a NodeJS script and an Excel file as the basis.
Some definitions are added (automatically) from manually maintained files.

The resulting files are stored in the folder structure below <code>openhab</code>, so in most cases copying the various files to the corresponding folders of your openHAB installation should do the trick.

It's also necessary to install the Modbus binding (https://www.openhab.org/addons/bindings/modbus/). You can do so by adding <code>modbus</code> to the 
<code>services/addons.cfg</code> file in the line <code>binding = </code>.

In order to run the script you need to install NodeJS as well as the relevant depdencies:
<code>npm install exceljs</code>

**WARNING: This project is still work in progress and has not yet been tested against actual hardware!**