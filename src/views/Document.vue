<template>
  <div class="container">
    <div class="card">
      <h1 class="card-title">
        Документ ({{ documentId }})
      </h1>

      <div v-if="!error">
        <div class="table-download-button">
          <q-btn
            class="table-button"
            color="primary"
            icon-right="archive"
            title="Скачать CSV"
            no-caps
            @click="exportTable(columns, rows, documentId)"
          />
        </div>

        <div class="q-pa-md">
          <q-table
            :rows="rows"
            :columns="columns"
            :loading="loading"
            :separator="separator"
            :rows-per-page-options=rowsPerPage
            hide-bottom
          >
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
          </q-table>
        </div>
      </div>

      <div v-else>
        {{ textNoDocument }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { QTable, QInnerLoading, QBtn } from 'quasar'
import { dateFormat } from '../Functions/FormatingFunctions.js'
import { exportTable } from '../Functions/ExportFile.js'

export default {
  components: {
    QTable, QInnerLoading, QBtn
  },

  setup() {
    const route = useRoute()
    const loading = ref(false)
    const documentId = ref(route.params.documentId)
    const rows = ref([])
    const columns = ref()
    const separator = ref('cell')
    const rowsPerPage = ref([0])
    const textNoDocument = ref('Документа с данным ID не существует')
    const error = ref(false)

    function setTableColumns() {
      columns.value = [{ name: 'parameter', label: 'Параметр', field: 'parameter', sortable: true, align: 'left' },
                       { name: 'value', label: 'Значение', field: 'value', sortable: true, align: 'left' }]
    }
    
    async function loadTableRows(docID) {
      let json
      try {
        loading.value = true

        const options = {
          method: 'GET',
          headers: {"Content-Type": "application/json"}
        }
        const responce = await fetch(`${process.env.VUE_APP_API_SOURCE}document/${docID}`, options)
        if(responce.status !== 200) {
          error.value = true
          throw new Error('Некорректный ID')
        }

        json = await responce.json()
      } catch (error) {
        console.log('Document Ошибка при загрузке свойств документа:', error)
        loading.value = false
        return null
      }

      loading.value = false
      const tableRows = json      
      
      return tableRows
    }

    function setTableRows(tableRows) {
      rows.value = []
      if(!tableRows) return
      if(tableRows.length === 0) return

      const newRows = []

      for(const [key, value] of Object.entries(tableRows)) {
        const newRow = {}
        
        newRow.parameter = key
        if(key.includes('date')){
          newRow.value = dateFormat(value)
        } else {
          newRow.value = value
        }

        newRows.push(newRow)
      }

      rows.value = [...newRows]
    }
    
    async function loadData() {
      const tableRows = await loadTableRows(documentId.value)
      setTableRows(tableRows)
    }
    
    onMounted(() => {
      setTableColumns()
      loadData()
    })
    
    return {      
      documentId,
      loading,
      rows,
      columns,
      separator,
      rowsPerPage,
      textNoDocument,
      error,
      exportTable
    }
  },
}
</script>