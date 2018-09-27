var majesty = require('majesty')
var etl = require('../dist/index.js');

function exec(describe, it, beforeEach, afterEach, expect, should, assert) {

    describe("Testes de leitura de XLSX", function () {

        it("Leitura de uma simples de planilha", function () {
            let file = new java.io.File('resources/planilhaSimples.xlsx').getAbsolutePath()
            let expected = require('/resources/planilhaSimplesExpected.js')
            let i = 0;

            etl({})
                .set_input_xlsx_file(file, 0)
                .for_each(function (options, values) {
                    expect(values, 'Linha ' + (i + 1)).to.deep.equals(expected[i++])
                })
        });

        it("Leitura da planilha de planejamento", function () {
            let file = new java.io.File('resources/planilhaPlanejamento.xlsx').getAbsolutePath()
            let expected = require('/resources/planilhaPlanejamentoExpected.js')
            let i = 0;

            etl({})
                .set_input_xlsx_file(file, 0)
                .for_each(function (options, values) {
                    expect(values, 'Linha ' + (i + 1)).to.deep.equals(expected[i++])
                })
        });
    });
}

var res = majesty.run(exec)
exit(res.failure.length);