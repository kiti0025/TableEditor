import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'

const app = express()
const PORT = 3001

// 创建保存目录
const saveDir = 'C:\\TableData'
if (!fs.existsSync(saveDir)) {
  fs.mkdirSync(saveDir, { recursive: true })
}

app.use(cors())
app.use(express.json())

// 保存表格数据
app.post('/api/save-table', (req, res) => {
  try {
    const { filename, tableState } = req.body
    const filePath = path.join(saveDir, filename)
    
    fs.writeFileSync(filePath, JSON.stringify(tableState, null, 2))
    res.json({ success: true, message: '保存成功' })
  } catch (error) {
    console.error('保存失败:', error)
    res.status(500).json({ success: false, message: '保存失败' })
  }
})

// 加载表格数据
app.get('/api/load-table', (req, res) => {
  try {
    const { filename } = req.query
    const filePath = path.join(saveDir, filename)
    
    if (fs.existsSync(filePath)) {
      const tableState = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      res.json({ success: true, tableState })
    } else {
      res.status(404).json({ success: false, message: '文件不存在' })
    }
  } catch (error) {
    console.error('加载失败:', error)
    res.status(500).json({ success: false, message: '加载失败' })
  }
})

// 获取文件列表
app.get('/api/load-file-list', (req, res) => {
  try {
    const files = fs.readdirSync(saveDir).filter(file => file.endsWith('.json'))
    res.json({ success: true, files })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({ success: false, message: '获取文件列表失败' })
  }
})

// 删除文件
app.delete('/api/delete-file', (req, res) => {
  try {
    const { filename } = req.query
    const filePath = path.join(saveDir, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: '删除成功' })
    } else {
      res.status(404).json({ success: false, message: '文件不存在' })
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})