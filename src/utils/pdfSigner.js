import { PDFDocument, rgb } from 'pdf-lib'
import { saveAs } from 'file-saver'
import * as pdfjsLib from 'pdfjs-dist'

// 設置 pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 載入 PDF
export async function loadPDFForSigning(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    return pdfDoc
  } catch (error) {
    console.error('載入 PDF 錯誤:', error)
    throw error
  }
}

// 添加手寫簽名到 PDF（從 canvas）
export async function addSignatureFromCanvas(pdfDoc, pageIndex, canvas, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    // 將 canvas 轉換為圖片
    const imageBytes = await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        blob.arrayBuffer().then(resolve)
      }, 'image/png')
    })
    
    // 嵌入圖片到 PDF
    const image = await pdfDoc.embedPng(imageBytes)
    
    const width = options.width || image.width
    const height = options.height || image.height
    
    page.drawImage(image, {
      x: x,
      y: y,
      width: width,
      height: height,
    })
    
    return pdfDoc
  } catch (error) {
    console.error('添加簽名錯誤:', error)
    throw error
  }
}

// 添加文字簽名到 PDF
export async function addTextSignature(pdfDoc, pageIndex, text, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const fontSize = options.fontSize || 24
    const color = options.color || rgb(0, 0, 0)
    
    // 使用 canvas 渲染文字（支援中文）
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const padding = 10
    ctx.font = `${fontSize}px "Brush Script MT", "Lucida Handwriting", cursive, "Microsoft YaHei", "SimHei", sans-serif`
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize * 1.5
    
    canvas.width = textWidth + padding * 2
    canvas.height = textHeight + padding * 2
    
    ctx.font = `${fontSize}px "Brush Script MT", "Lucida Handwriting", cursive, "Microsoft YaHei", "SimHei", sans-serif`
    ctx.fillStyle = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
    ctx.textBaseline = 'top'
    ctx.fillText(text, padding, padding)
    
    const imageBytes = await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        blob.arrayBuffer().then(resolve)
      }, 'image/png')
    })
    
    const image = await pdfDoc.embedPng(imageBytes)
    
    page.drawImage(image, {
      x: x,
      y: y - textHeight,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
    })
    
    return pdfDoc
  } catch (error) {
    console.error('添加文字簽名錯誤:', error)
    throw error
  }
}

// 添加上傳的簽名圖片到 PDF
export async function addSignatureImage(pdfDoc, pageIndex, imageFile, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const arrayBuffer = await imageFile.arrayBuffer()
    let image
    
    // 檢測圖片格式
    const uint8Array = new Uint8Array(arrayBuffer)
    const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
                 uint8Array[2] === 0x4E && uint8Array[3] === 0x47
    const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8
    
    if (isPNG) {
      image = await pdfDoc.embedPng(arrayBuffer)
    } else if (isJPEG) {
      image = await pdfDoc.embedJpg(arrayBuffer)
    } else {
      // 嘗試使用 Canvas 轉換
      const img = new Image()
      const url = URL.createObjectURL(imageFile)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('無法載入簽名圖片'))
        }
        img.src = url
      })
      
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      
      URL.revokeObjectURL(url)
      
      const pngBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      })
      
      const pngArrayBuffer = await pngBlob.arrayBuffer()
      image = await pdfDoc.embedPng(pngArrayBuffer)
    }
    
    const width = options.width || image.width
    const height = options.height || image.height
    
    page.drawImage(image, {
      x: x,
      y: y,
      width: width,
      height: height,
    })
    
    return pdfDoc
  } catch (error) {
    console.error('添加簽名圖片錯誤:', error)
    throw error
  }
}

// 添加日期到 PDF
export async function addDate(pdfDoc, pageIndex, date, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const fontSize = options.fontSize || 12
    const color = options.color || rgb(0, 0, 0)
    
    // 使用 canvas 渲染日期（支援中文）
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const padding = 5
    ctx.font = `${fontSize}px Arial, "Microsoft YaHei", sans-serif`
    const metrics = ctx.measureText(date)
    const textWidth = metrics.width
    const textHeight = fontSize * 1.2
    
    canvas.width = textWidth + padding * 2
    canvas.height = textHeight + padding * 2
    
    ctx.font = `${fontSize}px Arial, "Microsoft YaHei", sans-serif`
    ctx.fillStyle = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
    ctx.textBaseline = 'top'
    ctx.fillText(date, padding, padding)
    
    const imageBytes = await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        blob.arrayBuffer().then(resolve)
      }, 'image/png')
    })
    
    const image = await pdfDoc.embedPng(imageBytes)
    
    page.drawImage(image, {
      x: x,
      y: y - textHeight,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
    })
    
    return pdfDoc
  } catch (error) {
    console.error('添加日期錯誤:', error)
    throw error
  }
}

// 保存已簽署的 PDF
export async function saveSignedPDF(pdfDoc, originalFileName) {
  try {
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'))
    const signedFileName = `${nameWithoutExt}_signed.pdf`
    saveAs(blob, signedFileName)
    return blob
  } catch (error) {
    console.error('保存簽署 PDF 錯誤:', error)
    throw error
  }
}

// 獲取頁面尺寸
export function getPageSize(page) {
  const { width, height } = page.getSize()
  return { width, height }
}

