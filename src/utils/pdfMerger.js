import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 檢查是否為 PDF 文件
function isPDF(filename) {
  return filename.toLowerCase().endsWith('.pdf')
}

// 檢查是否為圖片文件
function isImage(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(ext)
}

// 檢查是否為 Word 文件
function isWord(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return ['doc', 'docx'].includes(ext)
}

// 檢查是否為 Excel 文件
function isExcel(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return ['xls', 'xlsx'].includes(ext)
}

// 檢查是否為 PowerPoint 文件
function isPowerPoint(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  return ['ppt', 'pptx'].includes(ext)
}

// 將圖片轉換為 PDF
async function imageToPDF(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)
    
    img.onload = () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210
        const imgHeight = (img.height * imgWidth) / img.width
        
        const fileExtension = imageFile.name.split('.').pop().toLowerCase()
        const imageFormat = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'JPEG' : 'PNG'
        
        if (imgHeight > 297) {
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
}

// 將 Word 轉換為 PDF
async function wordToPDF(wordFile) {
  try {
    const arrayBuffer = await wordFile.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const html = result.value
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.backgroundColor = '#ffffff'
    document.body.appendChild(tempDiv)
    
    const canvas = await html2canvas(tempDiv, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
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

// 將 Excel 轉換為 PDF
async function excelToPDF(excelFile) {
  try {
    const arrayBuffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const html = XLSX.utils.sheet_to_html(worksheet)
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '297mm'
    tempDiv.style.padding = '10mm'
    tempDiv.style.backgroundColor = '#ffffff'
    const table = tempDiv.querySelector('table')
    if (table) {
      table.style.borderCollapse = 'collapse'
      table.style.width = '100%'
    }
    document.body.appendChild(tempDiv)
    
    const canvas = await html2canvas(tempDiv, { 
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    document.body.removeChild(tempDiv)
    
    const imgData = canvas.toDataURL('image/png', 0.95)
    const pdf = new jsPDF('l', 'mm', 'a4')
    const imgWidth = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 210
    
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

// 將文件轉換為 PDF（如果需要）
async function convertToPDFIfNeeded(file) {
  if (isPDF(file.name)) {
    return file
  } else if (isImage(file.name)) {
    const pdfBlob = await imageToPDF(file)
    return new File([pdfBlob], file.name.replace(/\.[^/.]+$/, '.pdf'), { type: 'application/pdf' })
  } else if (isWord(file.name)) {
    const pdfBlob = await wordToPDF(file)
    return new File([pdfBlob], file.name.replace(/\.[^/.]+$/, '.pdf'), { type: 'application/pdf' })
  } else if (isExcel(file.name)) {
    const pdfBlob = await excelToPDF(file)
    return new File([pdfBlob], file.name.replace(/\.[^/.]+$/, '.pdf'), { type: 'application/pdf' })
  } else {
    throw new Error(`不支援的檔案格式: ${file.name}`)
  }
}

// 合併 PDF 文件
export async function mergePDFs(files, onProgress) {
  try {
    if (!files || files.length === 0) {
      throw new Error('請至少選擇一個檔案')
    }

    if (onProgress) onProgress(5)

    // 創建新的 PDF 文檔
    const mergedPdf = await PDFDocument.create()

    // 處理每個文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (onProgress) {
        onProgress(5 + (i / files.length) * 85)
      }

      try {
        // 將文件轉換為 PDF（如果需要）
        const pdfFile = await convertToPDFIfNeeded(file)
        
        // 讀取 PDF
        const arrayBuffer = await pdfFile.arrayBuffer()
        
        // 載入 PDF
        const pdf = await PDFDocument.load(arrayBuffer)
        
        // 複製所有頁面到合併的 PDF
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach((page) => {
          mergedPdf.addPage(page)
        })
      } catch (error) {
        console.error(`處理檔案 ${file.name} 時發生錯誤:`, error)
        throw new Error(`無法處理檔案 ${file.name}: ${error.message}`)
      }
    }

    if (onProgress) onProgress(95)

    // 保存合併後的 PDF
    const mergedPdfBytes = await mergedPdf.save({
      useObjectStreams: false,
    })

    if (onProgress) onProgress(100)

    return new Blob([mergedPdfBytes], { type: 'application/pdf' })
  } catch (error) {
    console.error('合併 PDF 錯誤:', error)
    throw error
  }
}

// 下載合併後的文件
export function downloadMergedFile(blob, filename = 'merged.pdf') {
  saveAs(blob, filename)
}

