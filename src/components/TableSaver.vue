<template>
  <div class="table-saver">
    <button @click="showSaveDialog = true" class="btn save-btn" title="保存当前模板">保存</button>
    <button @click="showList = !showList" class="btn list-btn" title="显示已保存模板列表">列表</button>
    
    <!-- 保存对话框 -->
    <div v-if="showSaveDialog" class="modal" @click.self="showSaveDialog = false">
      <div class="modal-content">
        <h3>保存文件</h3>
        <input 
          v-model="fileName" 
          type="text" 
          placeholder="请输入客户名称" 
          class="file-input"
          @keyup.enter="saveTable"
        >
        <div class="modal-buttons">
          <button @click="saveTable" class="btn save-btn" :disabled="!fileName.trim()">确定</button>
          <button @click="showSaveDialog = false" class="btn">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 文件列表对话框 -->
    <div v-if="showList" class="modal" @click.self="showList = false">
      <div class="modal-content">
        <h3>已保存的模板</h3>
        <div v-if="!fileList.length" class="no-files">暂无模板</div>
        <div v-else>
          <div v-for="file in fileList" :key="file" class="file-item">
            <span>{{ file.replace('.json', '') }}</span>
            <div class="file-actions">
              <button @click="loadTable(file)" class="btn load-btn">加载</button>
              <button @click="deleteFile(file)" class="btn delete-btn">删除</button>
            </div>
          </div>
        </div>
        <button @click="showList = false" class="btn close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['hotInstance', 'getCellStyles', 'setCellStyles'])
const showSaveDialog = ref(false)
const showList = ref(false)
const fileList = ref([])
const fileName = ref('')

const saveTable = async () => {
  if (!props.hotInstance || !fileName.value.trim()) {
    if (!fileName.value.trim()) {
      alert('请输入客户名称！')
    }
    return
  }
  
  const hot = props.hotInstance
  const tableState = {
    data: hot.getData(),
    mergeCells: hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells,
    cellStyles: props.getCellStyles?.() || {},
    colWidths: Array.from({ length: hot.countCols() }, (_, i) => hot.getColWidth(i)),
    rowHeights: Array.from({ length: hot.countRows() }, (_, i) => hot.getRowHeight(i))
  }
  
  const filename = `${fileName.value.trim()}.json`
  
  try {
    const response = await fetch('/api/save-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, tableState })
    })
    
    if (response.ok) {
      alert('保存成功！')
      fileName.value = ''
      showSaveDialog.value = false
      loadFileList()
    } else {
      alert('保存失败！')
    }
  } catch (error) {
    alert('保存失败！')
  }
}

const loadTable = async (filename) => {
  try {
    const response = await fetch(`/api/load-table?filename=${filename}`)
    const { tableState } = await response.json()
    
    if (response.ok && props.hotInstance) {
      const hot = props.hotInstance
      hot.loadData(tableState.data)
      
      setTimeout(() => {
        // 先清除所有现有的合并单元格
        const mergeCellsPlugin = hot.getPlugin('mergeCells')
        mergeCellsPlugin.clearCollections()
        
        // 清空所有旧样式（先传入空对象）
        if (props.setCellStyles) {
          props.setCellStyles({})
        }
        
        // 如果新文件有合并单元格，则应用它们
        if (tableState.mergeCells?.length) {
          tableState.mergeCells.forEach(m => {
            mergeCellsPlugin.merge(m.row, m.col, m.row + m.rowspan - 1, m.col + m.colspan - 1)
          })
        }
        
        // 恢复新文件的样式
        if (tableState.cellStyles && props.setCellStyles) {
          props.setCellStyles(tableState.cellStyles)
        }
        
        hot.render()
      }, 100)
      
      showList.value = false
    } else {
      alert('加载失败！')
    }
  } catch (error) {
    alert('加载失败！')
  }
}

const loadFileList = async () => {
  try {
    const response = await fetch('/api/file-list')
    const { files } = await response.json()
    fileList.value = files || []
  } catch (error) {
    console.error('获取文件列表失败:', error)
  }
}

const deleteFile = async (filename) => {
  if (!confirm(`确定要删除模板 "${filename.replace('.json', '')}" 吗？`)) {
    return
  }
  
  try {
    const response = await fetch(`/api/delete-file?filename=${filename}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      alert('删除成功！')
      loadFileList()
    } else {
      alert('删除失败！')
    }
  } catch (error) {
    alert('删除失败！')
  }
}

onMounted(loadFileList)
</script>

<style scoped>
.table-saver {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: white;
}

.btn:hover { border-color: #999; }
.btn:disabled { background: #ccc; border-color: #ccc; cursor: not-allowed; }
/* .save-btn { background: #4CAF50; color: white; border-color: #4CAF50; }
.list-btn { background: #2196F3; color: white; border-color: #2196F3; } */
.load-btn { background: #4CAF50; color: white; border-color: #4CAF50; }
.delete-btn { background: #f44336; color: white; border-color: #f44336; }
.close-btn { background: #f44336; color: white; border-color: #f44336; margin-top: 10px; }

.file-actions {
  display: flex;
  gap: 10px;
}

.file-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin: 10px 0;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.no-files {
  text-align: center;
  color: #666;
  padding: 20px 0;
}
</style>