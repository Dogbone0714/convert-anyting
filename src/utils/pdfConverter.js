import { PDFDocument } from 'pdf-lib'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import PptxGenJS from 'pptxgenjs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

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

// PDF 轉 Word (使用 HTML 作為中介)
export async function pdfToWord(pdfFile) {
  try {
    // 讀取 PDF
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // 創建 HTML 內容
    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>'
    
    // 注意：pdf-lib 無法直接提取文字，這裡是簡化版本
    // 實際應用中需要使用 pdf.js 或其他 OCR 工具
    htmlContent += '<p>PDF 轉換為 Word 文件</p>'
    htmlContent += `<p>頁數: ${pages.length}</p>`
    htmlContent += '</body></html>'
    
    // 使用 mammoth 將 HTML 轉為 Word (需要先轉換)
    // 這裡簡化處理，實際需要更複雜的轉換邏輯
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    return blob
  } catch (error) {
    console.error('PDF 轉 Word 錯誤:', error)
    throw error
  }
}

// PDF 轉 Excel
export async function pdfToExcel(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // 創建工作簿
    const wb = XLSX.utils.book_new()
    
    // 創建工作表數據
    const data = [['PDF 內容'], [`頁數: ${pages.length}`], ['注意：此為簡化版本，實際轉換需要 OCR 技術']]
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    
    // 生成 Excel 文件
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } catch (error) {
    console.error('PDF 轉 Excel 錯誤:', error)
    throw error
  }
}

// PDF 轉 PowerPoint
export async function pdfToPowerPoint(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    const pptx = new PptxGenJS()
    
    // 為每一頁創建幻燈片
    for (let i = 0; i < Math.min(pages.length, 10); i++) {
      const slide = pptx.addSlide()
      slide.addText(`PDF 頁面 ${i + 1}`, {
        x: 1,
        y: 1,
        w: 8,
        h: 1,
        fontSize: 24,
        bold: true
      })
      slide.addText(`總頁數: ${pages.length}`, {
        x: 1,
        y: 2,
        w: 8,
        h: 1,
        fontSize: 18
      })
    }
    
    return await pptx.write({ outputType: 'blob' })
  } catch (error) {
    console.error('PDF 轉 PowerPoint 錯誤:', error)
    throw error
  }
}

// PDF 轉圖片 (JPG/PNG)
export async function pdfToImage(pdfFile, format = 'png') {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    // 使用 canvas 渲染 PDF 頁面
    // 注意：這需要 pdf.js 來實際渲染，這裡是簡化版本
    const images = []
    
    // 實際應用中需要使用 pdf.js 的 render 功能
    // 這裡返回一個包含頁面信息的占位符
    for (let i = 0; i < pages.length; i++) {
      // 創建一個簡單的 canvas 圖像
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      
      // 繪製背景和文字
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#333333'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`PDF 頁面 ${i + 1}`, canvas.width / 2, canvas.height / 2)
      
      canvas.toBlob((blob) => {
        images.push(blob)
      }, `image/${format}`, 0.9)
    }
    
    // 返回第一張圖片（簡化處理）
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#333333'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PDF 頁面 1', canvas.width / 2, canvas.height / 2)
      canvas.toBlob((blob) => resolve(blob), `image/${format}`, 0.9)
    })
  } catch (error) {
    console.error('PDF 轉圖片錯誤:', error)
    throw error
  }
}

// Word 轉 PDF
export async function wordToPDF(wordFile) {
  try {
    const arrayBuffer = await wordFile.arrayBuffer()
    
    // 使用 mammoth 將 Word 轉為 HTML
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const html = result.value
    
    // 創建臨時 div 來渲染 HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    document.body.appendChild(tempDiv)
    
    // 使用 html2canvas 轉換為圖片，然後用 jsPDF 創建 PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true
    })
    
    document.body.removeChild(tempDiv)
    
    const imgData = canvas.toDataURL('image/png')
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

// Excel 轉 PDF
export async function excelToPDF(excelFile) {
  try {
    const arrayBuffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 獲取第一個工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 轉換為 HTML 表格
    const html = XLSX.utils.sheet_to_html(worksheet)
    
    // 創建臨時 div
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '20mm'
    document.body.appendChild(tempDiv)
    
    // 轉換為 PDF
    const canvas = await html2canvas(tempDiv, { scale: 2 })
    document.body.removeChild(tempDiv)
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4') // 橫向
    const imgWidth = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    
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

