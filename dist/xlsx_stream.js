var ZipFile = Java.type("java.util.zip.ZipFile")
var XMLInputFactory = Java.type("javax.xml.stream.XMLInputFactory")
var XMLStreamConstants = Java.type("javax.xml.stream.XMLStreamConstants")
var QName = Java.type("javax.xml.namespace.QName")

function XlsxInputStream(filename, sheet, options) {
    this.init(filename, sheet, options)
}

XlsxInputStream.prototype = {
    shared_strings: null,
    sheets_entry: null,
    workbook: null,
    xml_reader: null,
    rowId: 0,

    init: function _init(filename, sheet, options) {
        var zipFile = new ZipFile(filename)
        var nro_sheet = 1

        this.options = options
        this.sheets_entry = getSheetsXML(zipFile)
        this.workbook = getWorkbook(zipFile)
        this.shared_strings = getSharedStrings(zipFile)
        nro_sheet = (typeof(sheet) === "string") ? parseInt(this.workbook[sheet]) : sheet
        // print("Sheets[1] => ", this.sheets_entry[nro_sheet])
        this.xml_reader = XMLInputFactory.newInstance().createXMLEventReader(this.sheets_entry[nro_sheet])
    },

    forEach: function _forEach(for_each_function) {
      var current_row

      while ((current_row = this.next_row_json()) && (Object.keys(current_row).length > 0)) {
          for_each_function(current_row)
      }
    },

    next_row: function _next_row() {
        var shared_strings = this.shared_strings
        
        function get_start_tag_name(evt) {
            return evt.asStartElement().getName().getLocalPart()
        }
    
        function get_end_tag_name(evt) {
            return evt.asEndElement().getName().getLocalPart()
        }
    
        function get_row(xml) {
            var row = []
            var value
 
            while (xml.hasNext() && !(event !== undefined && event.isEndElement() && get_end_tag_name(event).equals("row"))) {
                event = xml.nextEvent()
    
                if (event.isStartElement() && get_start_tag_name(event).equals("c")) {
                    // print(event.asStartElement().getAttributes().forEachRemaining(function(att){ print(att) }))
                    // var key = event.asStartElement().getAttributeByName(new QName("r")).getValue().replaceAll("\\d+", "")
                    var t = event.asStartElement().getAttributeByName(new QName("t")) //.getValue()
    
                    event = xml.nextEvent()
    
                    if (event.isEndElement()) {
                        row.push(null)
                    } else {
                        while (xml.hasNext() && !(event.isStartElement() && get_start_tag_name(event).equals("v")))
                            event = xml.nextEvent()
    
                        if (xml.hasNext()) {
                            event = xml.nextEvent()
                            value = event.asCharacters().getData()
                            row.push ( 
                                (t &&  t.getValue() == "s") 
                                    ? shared_strings[parseInt(value)]
                                    : value 
                            )
                        }
                    }
                }
            }
    
            return row
        }

        while (this.xml_reader.hasNext()) {
            var event = this.xml_reader.nextEvent()

            if (event.isStartElement() && get_start_tag_name(event).equals("row")) {
                this.rowId++                
                return get_row(this.xml_reader)
            }
        }

        return null
    },

    next_row_json: function _next_row_json() {
        var shared_strings = this.shared_strings
        var row = {}
        var self = this
        
        function get_start_tag_name(evt) {
            return evt.asStartElement().getName().getLocalPart()
        }
    
        function get_end_tag_name(evt) {
            return evt.asEndElement().getName().getLocalPart()
        }
    
        function get_row(xml) {
            row = {}
 
            while (xml.hasNext() && !(event !== undefined && event.isEndElement() && get_end_tag_name(event).equals("row"))) {
                event = xml.nextEvent()
    
                if (event.isStartElement() && get_start_tag_name(event).equals("c")) {

                    var key = event.asStartElement().getAttributeByName(new QName("r")).getValue().replaceAll("\\d+", "")
                    var t = event.asStartElement().getAttributeByName(new QName("t"))
    
                    event = xml.nextEvent()
    
                    if (event.isEndElement()) {
                        row[key] = ""
                    } else {
                        while (xml.hasNext() && !(event.isStartElement() && get_start_tag_name(event).equals("v")))
                            event = xml.nextEvent()
    
                        if (xml.hasNext()) {
                            event = xml.nextEvent()
                            var value = event.asCharacters().getData()
                            row[key] = (t && t.getValue() == "s") 
                                ? shared_strings[parseInt(value)]
                                : value
                        }
                    }
                }
            }
            row.rowId = self.rowId
            return row
        }

        while (this.xml_reader.hasNext()) {
            var event = this.xml_reader.nextEvent()

            if (event.isStartElement() && get_start_tag_name(event).equals("row")) {
                this.rowId++        
                return get_row(this.xml_reader)
            }
        }

        return row
    },

    take_tail: function _take_tail() {
        return this
    },

    take_head: function _take_head() {
        return this.next_row()
    },

    take_fields_from_header_row: function _take_fields_from_header_row() {
        var head = this.take_head()
        if (head && (Object.keys(head).length > 0)) {
            var fields = head.map(function _normalizar(field) {
                if (field) {
                    return field
                        .replace(/\s+/, "")
                        .replace(/á|é|í|ó|ú|ã|õ|à|â|ê|ô|ç|Á|É|Í|Ó|Ú|Ã|Õ|À|Â|Ê|Ô|Ç/gi, function(matched) {
                            return {
                                "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", 
                                "ã": "a", "õ": "o", "à": "a", "â": "a", "ê": "e", "ô": "o", "ç": "c", 
                                "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", 
                                "Ã": "A", "Õ": "O", "À": "A", "Â": "A", "Ê": "E", "Ô": "O", "Ç": "C"
                            }[matched]
                        })
                        .toLowerCase()
                }
                else {
                    return null
                }
            })
        }
    
        // print("fields => ", fields)
        return fields

    }
}

function getSheetsXML(zipFile) {
    var em = zipFile.entries()
    var sheets = []
    var zipEntry = null

    while (em.hasMoreElements()) {
        zipEntry = em.nextElement()

        if (zipEntry.getName().contains("sheet")) {
            sheets.push(zipFile.getInputStream((zipEntry)))
        }
    }

    return sheets
}

function getSharedStrings(zipFile) {

    var em = zipFile.entries()
    var strings = null
    var zipEntry = null

    while (em.hasMoreElements()) {
        zipEntry = em.nextElement()

        if (zipEntry.getName().contains("sharedStrings")) {
            strings = zipFile.getInputStream(zipEntry)
            break
        }
    }

    /* Now we have the xml stream with all unique strings, I'll use stax to read the xml and add them to a list */
    // var stringList = new ArrayList();
    var stringList = []
    var xmlStreamReader = XMLInputFactory.newInstance().createXMLStreamReader(strings)

    while (xmlStreamReader.hasNext()) {
        // go to next event
        xmlStreamReader.next()

        // the current event is characters and the content is not all white space
        if ((xmlStreamReader.getEventType() == XMLStreamConstants.CHARACTERS) && (xmlStreamReader.getText().trim().length() > 0)) {
            // stringList.add(xmlStreamReader.getText());
            stringList.push(xmlStreamReader.getText())
        }
    }

    xmlStreamReader.close()

    return stringList
}

function getWorkbook(zipFile) {
    var em = zipFile.entries()
    var workbook_input_stream = null
    var zipEntry = null

    while (em.hasMoreElements()) {
        zipEntry = em.nextElement()

        if (zipEntry.getName().contains("workbook")) {
            workbook_input_stream = zipFile.getInputStream(zipEntry)
            break
        }
    }

    var sheet_map = {}
    var xmlStreamReader = XMLInputFactory.newInstance().createXMLStreamReader(workbook_input_stream)
    var ns_r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

    while (xmlStreamReader.hasNext()) {
        xmlStreamReader.next()

        if (xmlStreamReader.getEventType() == XMLStreamConstants.START_ELEMENT && xmlStreamReader.getLocalName() == "sheet") {
            sheet_map[xmlStreamReader.getAttributeValue("", "name")] = xmlStreamReader.getAttributeValue(ns_r, "id").replaceAll("rId(\\d+)", "$1")
        }
    }

    xmlStreamReader.close()

    return sheet_map
}

exports = XlsxInputStream