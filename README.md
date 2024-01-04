# Configuration to integrate a Solinteg Inverter + Battery into openHAB

The implementation of the Solinteg Inverter Modbus Protocol is based on Register Table version 00.03 (2023-06-26) - see file in repository.

Most <code>Thing</code> and <code>Item</code> definitions are automatically generated based on a NodeJS script and an Excel file as the basis.

The resulting files are stored in the folder structure below <code>openhab</code>, so in most cases copying the various files to the corresponding folders of your openHAB installation should do the trick.

It's also necessary to install the Modbus binding (https://www.openhab.org/addons/bindings/modbus/). You can do so by adding <code>modbux</code> to the 
<code>services/addons.cfg</code> file in the line <code>binding = </code>.

TODO
