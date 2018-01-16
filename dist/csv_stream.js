// var Arrays = Java.type('java.util.Arrays')
var Spliterator = Java.type("java.util.Spliterator")
var Spliterators = Java.type("java.util.Spliterators")
var StreamSupport = Java.type("java.util.stream.StreamSupport")
var StandardCharsets = Java.type("java.nio.charset.StandardCharsets")


function CsvInputStream(filename, options) {
    this.init(filename, options)
}

CsvInputStream.prototype = {
    filename: null,
    options: null,
    stream: null,
    head_row: null,

    init: function _init(filename, options) {
        this.filename = filename
        this.options = options || {}
        this.stream = fs.lines(filename, StandardCharsets.ISO_8859_1)
    },

    take_tail: function _take_tail() {
        return this.stream
    },

    take_head: function _take_head() {
        if (this.head_row === null) {
            var spliterator
            var sourceIterator = this.stream.iterator()

            this.head_row = sourceIterator.next()
            spliterator = Spliterators.spliteratorUnknownSize(sourceIterator, Spliterator.NONNULL)
            this.stream = StreamSupport.stream(spliterator, false)
        }

        return this.head_row
    },

    take_fields_from_header_row: function _take_fields_from_header_row() {
        var head = this.take_head()
        // var tail = this.take_tail()
        var colsep = this.options.colsep || "|"
        var fields_name = head.split(colsep)
        var fields = fields_name.map(function _normalizar(field) {
            return field
                .replace(/\s+/, "")
                .replace(/á|é|í|ó|ú|ã|õ|à|â|ê|ô|ç|Á|É|Í|Ó|Ú|Ã|Õ|À|Â|Ê|Ô|Ç/gi, function(matched){
                    return {
                        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", 
                        "ã": "a", "õ": "o", "à": "a", "â": "a", "ê": "e", "ô": "o", "ç": "c", 
                        "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", 
                        "Ã": "A", "Õ": "O", "À": "A", "Â": "A", "Ê": "E", "Ô": "O", "Ç": "C"
                    }[matched]
                })
                .toLowerCase()
        })
    
        return fields
    }
}

exports = CsvInputStream
