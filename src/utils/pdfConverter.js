import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import PptxGenJS from 'pptxgenjs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'

// 設置 pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// 獲取文件擴展名
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

// 檢查是否為 PDF 文件
export function isPDF(filename) {
  return getFileExtension(filename) === 'pdf'
}

// 檢查是否為圖片文件
export function isImage(filename) {
  const ext = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(ext)
}

// 檢查是否為 Word 文件
export function isWord(filename) {
  const ext = getFileExtension(filename)
  return ['doc', 'docx'].includes(ext)
}

// 檢查是否為 Excel 文件
export function isExcel(filename) {
  const ext = getFileExtension(filename)
  return ['xls', 'xlsx'].includes(ext)
}

// 檢查是否為 PowerPoint 文件
export function isPowerPoint(filename) {
  const ext = getFileExtension(filename)
  return ['ppt', 'pptx'].includes(ext)
}

// PDF 轉 Word (使用 docx 庫生成真正的 DOCX 文件，保留格式)
export async function pdfToWord(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // 使用 pdf.js 讀取 PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    
    // 提取所有頁面的文字內容，保留格式信息
    const paragraphs = []
    let hasContent = false
    
    // 提取每一頁的文字和格式
    for (let pageNum = 1; pageNum <= Math.min(numPages, 50); pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // 處理文字內容，保留格式信息
      let currentParagraph = []
      let lastY = null
      
      textContent.items.forEach((item, index) => {
        if (item.str) {
          // 檢查是否需要開始新段落（Y 座標變化較大）
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            if (currentParagraph.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children: currentParagraph,
                })
              )
              currentParagraph = []
            }
          }
          
          // 提取字體大小（從 transform 矩陣計算）
          const fontSize = item.transform[0] || 12
          const docxFontSize = Math.max(18, Math.min(72, Math.round(fontSize * 1.5)))
          
          // 檢查是否為粗體（從字體名稱判斷）
          const fontName = item.fontName || ''
          const isBold = fontName.toLowerCase().includes('bold') || fontName.toLowerCase().includes('black')
          
          // 創建文字運行，保留格式
          currentParagraph.push(
            new TextRun({
              text: item.str,
              size: docxFontSize,
              bold: isBold,
            })
          )
          
          lastY = item.transform[5]
        }
      })
      
      // 添加最後一個段落
      if (currentParagraph.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: currentParagraph,
          })
        )
        hasContent = true
      }
      
      // 如果不是最後一頁，添加分頁符
      if (pageNum < Math.min(numPages, 50) && hasContent) {
        paragraphs.push(new Paragraph({ text: '' }))
      }
    }
    
    // 如果沒有提取到任何文字，創建一個空文檔
    if (!hasContent || paragraphs.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ' ',
              size: 22,
            }),
          ],
        })
      )
    }
    
    // 創建 Word 文檔
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    })
    
    // 生成 DOCX 文件
    const blob = await Packer.toBlob(doc)
    return blob
  } catch (error) {
    console.error('PDF 轉 Word 錯誤:', error)
    throw error
  }
}

// PDF 轉 Excel - 提取文字內容並組織成表格格式
export async function pdfToExcel(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // 使用 pdf.js 讀取 PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const numPages = Math.min(pdf.numPages, 50)
    
    // 創建工作簿
    const wb = XLSX.utils.book_new()
    
    // 提取每一頁的文字內容，嘗試組織成表格
    const allData = []
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // 按行組織文字（根據 Y 座標）
      const rows = {}
      
      textContent.items.forEach((item) => {
        if (item.str && item.str.trim()) {
          const y = Math.round(item.transform[5])
          if (!rows[y]) {
            rows[y] = []
          }
          rows[y].push({
            text: item.str,
            x: item.transform[4],
            fontSize: item.transform[0] || 12
          })
        }
      })
      
      // 將行轉換為數組，按 Y 座標排序
      const sortedRows = Object.keys(rows)
        .sort((a, b) => parseFloat(b) - parseFloat(a)) // 從上到下
        .map(y => {
          // 按 X 座標排序同一行的文字
          const sortedItems = rows[y].sort((a, b) => a.x - b.x)
          return sortedItems.map(item => item.text).join(' ')
        })
      
      // 添加到數據中
      if (sortedRows.length > 0) {
        allData.push([`--- 頁面 ${pageNum} ---`])
        sortedRows.forEach(row => {
          // 嘗試將行分割成多列（以空格或製表符分割）
          const cells = row.split(/\s{2,}|\t/).filter(cell => cell.trim())
          if (cells.length > 1) {
            allData.push(cells)
          } else {
            allData.push([row])
          }
        })
        allData.push([]) // 頁面間的空行
      }
    }
    
    // 如果沒有提取到數據，創建基本結構
    if (allData.length === 0) {
      allData.push(['PDF 內容'], [`總頁數: ${numPages}`], ['已提取文字內容'])
    }
    
    // 創建工作表
    const ws = XLSX.utils.aoa_to_sheet(allData)
    
    // 設置列寬
    const maxCols = Math.max(...allData.map(row => row.length))
    ws['!cols'] = Array(maxCols).fill({ wch: 20 })
    
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    
    // 生成 Excel 文件
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } catch (error) {
    console.error('PDF 轉 Excel 錯誤:', error)
    throw error
  }
}

// PDF 轉 PowerPoint - 將 PDF 頁面渲染為圖片後插入 PPT
export async function pdfToPowerPoint(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // 使用 pdf.js 讀取 PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const numPages = Math.min(pdf.numPages, 20) // 限制最多 20 頁
    
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE' // 使用寬屏佈局
    
    // 為每一頁創建幻燈片，將 PDF 頁面渲染為圖片
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.5 })
      
      // 創建 canvas 渲染 PDF 頁面
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      // 將 canvas 轉換為 base64 圖片
      const imageData = canvas.toDataURL('image/png')
      
      // 創建幻燈片並添加圖片
      const slide = pptx.addSlide()
      slide.addImage({
        data: imageData,
        x: 0,
        y: 0,
        w: 10,
        h: 7.5,
        sizing: { type: 'contain', w: 10, h: 7.5 }
      })
    }
    
    return await pptx.write({ outputType: 'blob' })
  } catch (error) {
    console.error('PDF 轉 PowerPoint 錯誤:', error)
    throw error
  }
}

// PDF 轉圖片 (JPG/PNG) - 使用 pdf.js 實際渲染 PDF 頁面
export async function pdfToImage(pdfFile, format = 'png') {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // 使用 pdf.js 讀取 PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    // 渲染第一頁為圖片
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2.0 }) // 提高解析度以保留更多細節
    
    // 創建 canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // 渲染 PDF 頁面到 canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    
    // 轉換為 blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('無法生成圖片'))
        }
      }, `image/${format}`, 0.95) // 高品質
    })
  } catch (error) {
    console.error('PDF 轉圖片錯誤:', error)
    throw error
  }
}

// Word 轉 PDF - 保留原始格式
export async function wordToPDF(wordFile) {
  try {
    const arrayBuffer = await wordFile.arrayBuffer()
    
    // 使用 mammoth 將 Word 轉為 HTML，保留樣式
    const result = await mammoth.convertToHtml({ 
      arrayBuffer,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ]
    })
    const html = result.value
    
    // 創建臨時 div 來渲染 HTML，保留格式
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.color = '#000000'
    // 保留原始樣式
    tempDiv.style.boxSizing = 'border-box'
    document.body.appendChild(tempDiv)
    
    // 使用 html2canvas 轉換為圖片，提高品質以保留格式
    const canvas = await html2canvas(tempDiv, {
      scale: 2.5, // 提高解析度
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: false,
      allowTaint: true,
      imageTimeout: 15000
    })
    
    document.body.removeChild(tempDiv)
    
    const imgData = canvas.toDataURL('image/png', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    return pdf.output('blob')
  } catch (error) {
    console.error('Word 轉 PDF 錯誤:', error)
    throw error
  }
}

// Excel 轉 PDF - 保留原始格式和表格結構
export async function excelToPDF(excelFile) {
  try {
    const arrayBuffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true })
    
    // 獲取第一個工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 轉換為 HTML 表格，保留樣式
    const html = XLSX.utils.sheet_to_html(worksheet, {
      id: 'excel-table',
      editable: false
    })
    
    // 創建臨時 div，保留表格格式
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '297mm' // 橫向 A4
    tempDiv.style.padding = '10mm'
    tempDiv.style.backgroundColor = '#ffffff'
    // 確保表格樣式保留
    const table = tempDiv.querySelector('table')
    if (table) {
      table.style.borderCollapse = 'collapse'
      table.style.width = '100%'
      table.style.fontSize = '12px'
    }
    document.body.appendChild(tempDiv)
    
    // 轉換為 PDF，提高解析度以保留格式
    const canvas = await html2canvas(tempDiv, { 
      scale: 2.5, // 提高解析度
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      imageTimeout: 15000
    })
    document.body.removeChild(tempDiv)
    
    const imgData = canvas.toDataURL('image/png', 0.95)
    const pdf = new jsPDF('l', 'mm', 'a4') // 橫向
    const imgWidth = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 210
    
    // 處理多頁情況
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage('l', 'a4')
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    return pdf.output('blob')
  } catch (error) {
    console.error('Excel 轉 PDF 錯誤:', error)
    throw error
  }
}

// 圖片轉 PDF
export async function imageToPDF(imageFile) {
  try {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const pdf = new jsPDF('p', 'mm', 'a4')
          const imgWidth = 210
          const imgHeight = (img.height * imgWidth) / img.width
          
          // 獲取圖片格式
          const fileExtension = getFileExtension(imageFile.name)
          const imageFormat = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'JPEG' : 'PNG'
          
          if (imgHeight > 297) {
            // 如果圖片太高，調整寬度
            const adjustedWidth = (img.width * 297) / img.height
            pdf.addImage(img, imageFormat, (210 - adjustedWidth) / 2, 0, adjustedWidth, 297)
          } else {
            pdf.addImage(img, imageFormat, 0, 0, imgWidth, imgHeight)
          }
          
          URL.revokeObjectURL(url)
          resolve(pdf.output('blob'))
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('無法載入圖片'))
      }
      
      img.src = url
    })
  } catch (error) {
    console.error('圖片轉 PDF 錯誤:', error)
    throw error
  }
}

// 最大文件大小：750MB
const MAX_FILE_SIZE = 750 * 1024 * 1024 // 786432000 bytes

// 主轉換函數
export async function convertFile(file, targetFormat, onProgress) {
  try {
    // 驗證文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`檔案大小超過限制！最大允許：${formatFileSize(MAX_FILE_SIZE)}`)
    }

    if (onProgress) onProgress(10)
    
    const fileName = file.name
    const fileExtension = getFileExtension(fileName)
    
    // 如果目標格式是 PDF
    if (targetFormat === 'pdf') {
      if (onProgress) onProgress(30)
      
      let result
      if (isWord(fileName)) {
        result = await wordToPDF(file)
      } else if (isExcel(fileName)) {
        result = await excelToPDF(file)
      } else if (isImage(fileName)) {
        result = await imageToPDF(file)
      } else {
        throw new Error('不支援的檔案格式')
      }
      
      if (onProgress) onProgress(100)
      return result
    }
    
    // 如果來源是 PDF，轉換為其他格式
    if (isPDF(fileName)) {
      if (onProgress) onProgress(30)
      
      let result
      if (targetFormat === 'docx' || targetFormat === 'doc') {
        result = await pdfToWord(file)
      } else if (targetFormat === 'xlsx' || targetFormat === 'xls') {
        result = await pdfToExcel(file)
      } else if (targetFormat === 'pptx' || targetFormat === 'ppt') {
        result = await pdfToPowerPoint(file)
      } else if (targetFormat === 'jpg' || targetFormat === 'png') {
        result = await pdfToImage(file, targetFormat)
      } else {
        throw new Error('不支援的目標格式')
      }
      
      if (onProgress) onProgress(100)
      return result
    }
    
    throw new Error('不支援的轉換組合')
  } catch (error) {
    console.error('轉換錯誤:', error)
    throw error
  }
}

// 下載文件
export function downloadFile(blob, filename) {
  saveAs(blob, filename)
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

