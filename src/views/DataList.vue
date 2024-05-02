<template>
  <div class="container">
    <div class="card">
      <h1 class="card-title">
        Список документов
      </h1>
      
      <div v-if="!error">
        <div class="q-pa-md">
          <div class="table-settings">
            <div class="table-sort">
              <q-select class="select-list" v-model="selectedSortLabel" :options="sortLabels" label="Сортировка" />
              <q-btn
                v-show="sortAsc"
                class="table-button table-button-sort"
                color="primary"
                icon-right="arrow_upward"
                title="По возрастанию"
                no-caps
                flat
                @click="changeSortDirection"
              />
              
              <q-btn
                v-show="!sortAsc"
                class="table-button table-button-sort"
                color="primary"
                icon-right="arrow_downward"
                title="По убыванию"
                no-caps
                flat
                @click="changeSortDirection"
              />
            </div>

            <div class="table-buttons">
              <q-input
                class="table-filter"
                v-model="filter"
                placeholder="Поиск"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>

              <q-btn
                class="table-button"
                color="primary"
                :disable="selected.length === 0"
                @click="openDocuments(getSelectedDocs())"
                label="Открыть"
                title="Открыть выбранные документы"
              />

              <q-btn
                class="table-button"
                color="primary"
                icon-right="archive"
                title="Скачать CSV"
                no-caps
                @click="exportTable(columns, rows, 'Список документов')"
              />
            </div>

          </div>
        </div>

        <div class="q-pa-md">
          <q-table
            :rows="rows"
            :columns="columns"
            :loading="loading"
            :separator="separator"
            v-model:pagination="pages"
            :rows-per-page-options = rowsPerPage            
            :row-key="rowKey"
            :filter="filter"
            selection="multiple"
            v-model:selected="selected"
            @row-dblclick="documentDoubleClick"
          >
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
          </q-table>
        </div>
      </div>

      <div v-else>
        {{ textNoColumns }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { QTable, QInnerLoading, QBtn, QSelect, QTr, QTh, QIcon, QInput } from 'quasar'
import { dateFormat } from '../Functions/FormatingFunctions.js'
import { exportTable } from '../Functions/ExportFile.js'

export default {
  components: {
    QTable, QInnerLoading, QBtn, QSelect, QTr, QTh, QIcon, QInput
  },

  setup () {
    const router = useRouter()
    const loading = ref(false)
    const rows = ref([])
    const columns = ref()
    const separator = ref('cell')
    const filter = ref('')
    let queryParameters = {}
    const loadStep = 5
    const pages = ref({})
    const rowsPerPage = ref([5, 10, 15, 20, 25, 50])
    const selected = ref([])
    const rowKey = ref(null)
    const selectedSortLabel = ref(null) // выбранная колонка для сортировки
    const sortLabels = ref([])          // список колонок для сортировки
    let sortNames = []          // список исходных имен колонок для сортировки
    let sortedColumn = null       // параметр для запроса (колонка)
    const sortAsc = ref(false)    // параметр для запроса (направление)
    const textNoColumns = ref('Сбой при загрузке данных!')
    const error = ref(false)

    async function loadTableColumns() {
      let json
      try {
        loading.value = true

        const options = {
          method: 'GET',
          headers: {"Content-Type": "application/json"}
        }
        const responce = await fetch(`${process.env.VUE_APP_API_SOURCE}description`, options)
        if(responce.status !== 200) {
          error.value = true
          throw new Error('невозможно получить список колонок')
        }

        json = await responce.json()
      } catch (error) {
        console.log('Ошибка при загрузке списка колонок:', error)
        loading.value = false
        return null
      }

      return json
    }

    function setTableColumns(cols) {
      const newColumns = []
      for(const [key, value] of Object.entries(cols)) {
        const column = { name: key, label: value, field: key, sortable: false, align: 'left' }
        if(key.includes('date')) {
          column.template = dateFormat
        }

        newColumns.push(column)
      }
      columns.value = [...newColumns]
      rowKey.value = columns.value[0].name
    }

    function getDefaultParameters() {
      return {
        "attributes": [
          "r_object_id",
          "ssa_name",
          "sdta_create_date",
          "sdta_date_approval",
          "ssa_category",
          "ssa_ord_number",
          "ssa_parent_kind_name",
          "ssa_kind_name",
          "ssa_doc_life_cycle_value",
          "ssa_doc_scope_value",
          "ssa_reg_number",
          "sdta_date_action",
          "sdta_date_action_end",
          "ssa_kod_doc",
          "ssa_prim",
          "ssa_doc_dev_inner",
          "sdta_date_revision",
          "ssa_doc_replacement",
          "ssa_doc_otmenen",
          "sdta_date_otmenen"
        ],
        "order": {
          "attr": sortedColumn,
          "asc": sortAsc.value
        },
        "filters": [],
        "size": loadStep * 2,
        "offset": 0
      }
    }

    async function loadTableRows(rowsCount = queryParameters.size) {
      let json
      try {
        loading.value = true

        const currentQueryParameters = {...queryParameters}
        currentQueryParameters.size = rowsCount

        const options = {
          method: 'POST',
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(currentQueryParameters)
        }        
        const responce = await fetch(`${process.env.VUE_APP_API_SOURCE}list`, options)
        if(responce.status !== 200) {
          error.value = true
          throw new Error('сбой при загрузке')
        }

        json = await responce.json()
      } catch (error) {
        console.log('Ошибка при загрузке строк:', error)
        loading.value = false
        return null
      }

      loading.value = false
      const tableRows = json.atributes      
      
      return tableRows
    }

    function setTableRows(tableRows) {
      rows.value = []
      if(!tableRows) return
      if(tableRows.length === 0) return

      rows.value = getRowsForTable(tableRows)
    }

    async function addRowsToTable(rowsCount = 0) {
      if(rowsCount === 0) return
      
      queryParameters.offset = rows.value.length

      const tableRows = await loadTableRows(rowsCount)
      if(tableRows.length === 0) return

      rows.value.push(...getRowsForTable(tableRows))
    }

    function getRowsForTable(tableRows){
      const newRows = []

      for(const row of tableRows) {
        const newRow = {}
        
        columns.value.forEach(col => {
          if(col.template ?? false) {
            newRow[col.name] = col.template(row[col.name])
          } else {
            newRow[col.name] = row[col.name]
          }
        })

        newRows.push(newRow)
      }

      return newRows
    }

    async function loadData() {
      const cols = await loadTableColumns()
      if(cols !== null) {
        setTableColumns(cols)
        queryParameters = getDefaultParameters()  // пока без параметров
        setDefaultSorting(cols)
        const tableRows = await loadTableRows()
        queryParameters.size = loadStep
        setTableRows(tableRows)
        if(rows.value.length === pages.value.rowsPerPage) {
          addRowsToTable(pages.value.rowsPerPage)
        }
      } else {
        columns.value = []
        rows.value = []
      }
    }

    function setDefaultSorting(cols) {
      sortLabels.value = Object.values(cols)
      sortNames = Object.keys(cols)
      selectedSortLabel.value = sortLabels.value[0]
      sortedColumn = sortNames[0]
      sortAsc.value = false
      queryParameters.order.attr = sortedColumn
      queryParameters.order.asc = sortAsc.value
    }

    function isLastPage() {
      if(pages.value.rowsPerPage * pages.value.page >= rows.value.length) {
        return true
      }

      return false
    }

    function openDocuments(docs) {
      for(const doc of docs) {
        openDocument(doc)
      }
    }

    function documentDoubleClick(event, doc) {
      openDocument(doc[sortNames[0]])
    }

    function openDocument(docID) {
      const routeData = router.resolve({name: 'Document', params: { documentId: docID }});
      window.open(routeData.href, '_blank');
    }

    function getSelectedDocs() {
      const selectedDocs = []
      
      for(const doc of selected.value) {
        selectedDocs.push(doc[rowKey.value])
      }

      return selectedDocs
    }

    function changeSortDirection () {
      sortAsc.value = !sortAsc.value
    }

    watch(pages, (newValue, oldValue) => {
      if(rows.value.length === 0) return
      if(newValue.rowsPerPage !== oldValue.rowsPerPage) {
        queryParameters.size = newValue.rowsPerPage
      }
      if(isLastPage()) {
        const rowsCountToAdd = (pages.value.rowsPerPage * pages.value.page) - rows.value.length + queryParameters.size
        addRowsToTable(rowsCountToAdd)
      }
    })

    watch(selectedSortLabel, (newValue, oldValue) => {
      const index = sortLabels.value.findIndex(item => item === newValue)

      if(sortedColumn === sortNames[index])  return

      sortedColumn = sortNames[index]

      queryParameters.order.attr = sortNames[index]
      reloadTableRows()
    })
    
    watch(sortAsc, (newValue, oldValue) => {
      queryParameters.order.asc = newValue
      reloadTableRows()
    })

    async function reloadTableRows() {
      rows.value = []
      queryParameters.offset = 0
      const tableRows = await loadTableRows(queryParameters.size*2)
      setTableRows(tableRows)
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      rows,
      columns,
      separator,
      filter,
      pages,
      rowsPerPage,
      selected,
      rowKey,
      selectedSortLabel,
      sortLabels,
      sortAsc,
      textNoColumns,
      error,
      documentDoubleClick,
      openDocuments,
      getSelectedDocs,
      changeSortDirection,
      exportTable
    }
  }
}
</script>
