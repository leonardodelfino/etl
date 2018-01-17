ETL
===============

ETL é um *bitcode* de processamento e transformação de arquivos (ETL) para [Thrust](https://github.com/Thrustjs/thrust).

# Instalação

Posicionado em um app [ThrustJS](https://github.com/thrustjs/thrust), no seu terminal:

```bash
thrust install etl
```

## Tutorial

```javascript
let etl = require('etl')
let file = new java.io.File('planilha.xlsx').getAbsolutePath()

  etl({})
    .set_input_xlsx_file(file, 0)
    .take_fields_from_header_row()
    .for_each(function (options, values) {
      show('CPF: ', values.C)
    })

```

## API

```javascript
/*
* Construtor do etl com um objeto de configurações de
* processamento.
*/
let etl = etl(options)

/*
 * 'etl' terá as seguintes funções, utilizadas para
 * setar a fonte de dados que será processada
*/
set_input_text_file(textFile)
set_input_xlsx_file(xlsxFile, sheetNumber)
set_input_string(content)

/*
 * Os métodos acima retornarão:
*/

/*
 * Preenche a propriedade fields no objeto de options, com todos os campos do header do arquivo
*/
take_fields_from_header_row()

/*
 * Função a ser executada antes de iniciar o loop das linhas
 * @param {Function} fn Função com assinatura (options)
*/
before_for_each(fn)

/*
 * Função a ser executada para cada linha
 * @param {Function} fn Função com assinatura (options, values)
*/
for_each(fn)

/*
 * Função a ser executada após a finalização do loop das linhas
 * @param {Function} fn Função com assinatura (options)
*/
after_for_each(fn)
```
