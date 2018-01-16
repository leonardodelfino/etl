var JArrays = Java.type("java.util.Arrays")
var XlsxOutputStream = require("./xlsx_stream")
var CsvOutputStream = require("./csv_stream")

function tokenizer(options) {
    return { 
        set_input_text_file: set_input_text_file.bind(null, options),
        set_input_xlsx_file: set_input_xlsx_file.bind(null, options),
        set_input_string: set_input_string.bind(null, options)
    }
}

tokenizer.counter = function _counter(initial_value) {
    var nextNumber = initial_value || 0

    return {
        next: function () {
            return nextNumber < Infinity ?
                { value: nextNumber++, done: false } :
                { done: true }
        }
    }
}

function set_input_text_file(options, text_file) {
    var stream = new CsvOutputStream(text_file, options)

    return { 
        take_fields_from_header_row: take_fields_from_header_row.bind(null, stream, options),
        before_for_each: before_for_each.bind(null, stream, options),
        for_each: for_each.bind(null, stream, options)
    }
}

function set_input_xlsx_file(options, xlsx_file, sheet) {
    var stream = new XlsxOutputStream(xlsx_file, sheet, options)

    return { 
        take_fields_from_header_row: take_fields_from_header_row.bind(null, stream, options),
        before_for_each: before_for_each.bind(null, stream, options),
        for_each: for_each.bind(null, stream, options)
    }
}

function set_input_string(options, content) {
    // var stream = JArrays.stream(content.split(options.rowsep))
    var stream = JArrays.stream(Java.to(content.split(options.rowsep), Java.type('java.lang.String[]')))

    return { 
        take_fields_from_header_row: take_fields_from_header_row.bind(null, stream, options),
        before_for_each: before_for_each.bind(null, stream, options),
        for_each: for_each.bind(null, stream, options)
    }
}

function take_fields_from_header_row(stream, options) {

    var fields = stream.take_fields_from_header_row()
    var tail = stream.take_tail()
    var opts = Object.assign({}, options) 
    
    opts.fields = fields

    return {
        before_for_each: before_for_each.bind(null, tail, opts),
        for_each: for_each.bind(null, tail, opts)
    }
}

function before_for_each(stream, options, fnc) {
    options.rowid = tokenizer.counter()
    
    fnc(options)

    return {
        for_each: for_each.bind(null, stream, options)
    }    
}

function after_for_each(options, fnc) {
    fnc(options)  
}

function for_each(stream, options, fnc) {
    stream.forEach( fnc.bind(null, options) )
 
    return {
        after_for_each: after_for_each.bind(null, options)
    }       
}

exports = tokenizer
