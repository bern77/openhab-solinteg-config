# Overview of the Code Generator

The code generator parses an Excel file, extract from there the relevant information for each modbus register and creates an object representation that can be used to create Thing as well as Item definitions alongside a basic sitemap.

The main class is <code>RegisterTable</code> which contains 2 collections holding objects of the 2 classes:
* <code>ContinuousRegisters</code> which represent a consecutive sequence of modbus registers that can be configured in a single <code>Bridge poller</code> in openHAB Modbus binding. Each <code>ContinuousRegisters</code> object contains a collection of <code>DataObject</code>, representing the various data elements defined in the spreadsheet.
* <code>DataObject</code>, which are also part of the <code>ContinuousRegisters</code> (see first bullet point), are also accessible in a separate collection, without the grouping by <code>ContinuousRegisters</code>.

The code generation finally happens in the <code>RegisterTable</code> based on the methods
* <code>toThingsCode()</code>,
* <code>toItemsCode()</code> and
* <code>toSitemapCode()</code>.

These methods in turn use the code generating methods of the <code>ContinuousRegisters</code> and <code>DataObject</code> objects in the above listed collections. In order to create nicely formatted code that also supports colum-wise editing (e.g. in VS Code), each <code>DataObject</code> has the methods <code>toThingCodeLine()</code> and <code>toItemCodeLine()</code> which return a <code>CodeLine</code> object. These can be added to a <code>CodeBlock</code> object, which takes care of rendering the code in a nice format.
Most importantly the <code>ContinuousRegisters</code> objects create <code>CodeBlock</code> objects for each <code>Bridge</code> including the corresponding <code>Things</code>. A <code>DataObject</code> corresponds to a <code>CodeLine</code>.