import {exportFile} from 'quasar'

export {exportTable, wrapCsvValue};

function  exportTable (columns, rows, fileName) {
  // naive encoding to csv format
  const content = [columns.map(col => wrapCsvValue(col.label)).join(';')].concat(
    rows.map(row => columns.map(col => wrapCsvValue(
    typeof col.field === 'function'
      ? col.field(row)
      : row[ col.field === void 0 ? col.name : col.field ],
    col.format,
    row
    )).join(';'))
  ).join('\r\n')

  const status = exportFile(
    `${fileName}.csv`,
    "\ufeff"+content,
    'text/csv'
  )

  if (status !== true) {
    $q.notify({
    message: 'Browser denied file download...',
    color: 'negative',
    icon: 'warning'
    })
  }
}

function wrapCsvValue (val, formatFn, row) {
  let formatted = formatFn !== void 0
    ? formatFn(val, row)
    : val

  formatted = formatted === void 0 || formatted === null
    ? ''
    : String(formatted)

  formatted = formatted.split('"').join('""')

  return `"${formatted.replace( /&nbsp;/g, "   " )}"`
}
