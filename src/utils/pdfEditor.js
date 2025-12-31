import { PDFDocument, rgb, PDFPage, PDFFont } from 'pdf-lib'
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

// 載入 PDF 並渲染頁面
export async function loadPDFForEditing(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // 使用 pdf-lib 載入 PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // 使用 pdf.js 渲染頁面（用於顯示）
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    return {
      pdfDoc,
      pdf,
      numPages: pdf.numPages
    }
  } catch (error) {
    console.error('載入 PDF 錯誤:', error)
    throw error
  }
}

// 渲染 PDF 頁面為圖片（用於顯示）
export async function renderPageToImage(pdf, pageNum, scale = 1.5) {
  try {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    
    return {
      canvas,
      dataURL: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height
    }
  } catch (error) {
    console.error('渲染頁面錯誤:', error)
    throw error
  }
}

// 添加文字到 PDF（支援中文）
export async function addTextToPDF(pdfDoc, pageIndex, text, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const fontSize = options.fontSize || 12
    const color = options.color || rgb(0, 0, 0)
    
    // 檢查是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(text)
    
    if (hasChinese) {
      // 對於中文字符，使用 canvas 渲染為圖片
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 設置 canvas 大小
      const padding = 10
      ctx.font = `${fontSize}px Arial, "Microsoft YaHei", "SimHei", sans-serif`
      const metrics = ctx.measureText(text)
      const textWidth = metrics.width
      const textHeight = fontSize * 1.2
      
      canvas.width = textWidth + padding * 2
      canvas.height = textHeight + padding * 2
      
      // 重新設置字體（因為 canvas 大小改變會重置）
      ctx.font = `${fontSize}px Arial, "Microsoft YaHei", "SimHei", sans-serif`
      ctx.fillStyle = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
      ctx.textBaseline = 'top'
      ctx.fillText(text, padding, padding)
      
      // 將 canvas 轉換為 PNG 圖片
      const imageBytes = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          blob.arrayBuffer().then(resolve)
        }, 'image/png')
      })
      
      // 嵌入圖片到 PDF
      const image = await pdfDoc.embedPng(imageBytes)
      
      // 在頁面上繪製圖片
      page.drawImage(image, {
        x: x,
        y: y - textHeight, // 調整 Y 座標（PDF 座標系統從下往上）
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
      })
    } else {
      // 對於非中文字符，直接使用字體
      try {
        const font = await pdfDoc.embedFont('Helvetica')
        page.drawText(text, {
          x: x,
          y: y,
          size: fontSize,
          font: font,
          color: color,
        })
      } catch (error) {
        // 如果字體嵌入失敗，也使用 canvas 方法
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const padding = 10
        ctx.font = `${fontSize}px Arial, sans-serif`
        const metrics = ctx.measureText(text)
        const textWidth = metrics.width
        const textHeight = fontSize * 1.2
        
        canvas.width = textWidth + padding * 2
        canvas.height = textHeight + padding * 2
        
        ctx.font = `${fontSize}px Arial, sans-serif`
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
      }
    }
    
    return pdfDoc
  } catch (error) {
    console.error('添加文字錯誤:', error)
    throw error
  }
}

// 添加圖片到 PDF
export async function addImageToPDF(pdfDoc, pageIndex, imageFile, x, y, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const arrayBuffer = await imageFile.arrayBuffer()
    let image
    
    // 檢查文件類型
    const fileType = imageFile.type || ''
    const fileName = imageFile.name || ''
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
    
    // 根據圖片類型嵌入，使用更寬鬆的檢測
    try {
      if (fileType === 'image/png' || fileExtension === 'png') {
        image = await pdfDoc.embedPng(arrayBuffer)
      } else if (fileType === 'image/jpeg' || fileType === 'image/jpg' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
        // 驗證 JPEG 文件
        const uint8Array = new Uint8Array(arrayBuffer)
        const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8
        
        if (!isJPEG) {
          // 如果不是有效的 JPEG，嘗試使用 PNG 方法
          try {
            image = await pdfDoc.embedPng(arrayBuffer)
          } catch (pngError) {
            throw new Error('圖片格式無效或已損壞。請確保上傳的是有效的 PNG 或 JPEG 圖片。')
          }
        } else {
          image = await pdfDoc.embedJpg(arrayBuffer)
        }
      } else {
        // 嘗試自動檢測格式
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // 檢查 PNG 簽名
        const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
                     uint8Array[2] === 0x4E && uint8Array[3] === 0x47
        
        // 檢查 JPEG 簽名
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
              reject(new Error('無法載入圖片。請確保上傳的是有效的圖片文件。'))
            }
            img.src = url
          })
          
          // 將圖片轉換為 canvas 然後轉為 PNG
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
      }
    } catch (embedError) {
      // 如果直接嵌入失敗，嘗試使用 Canvas 轉換
      try {
        const img = new Image()
        const url = URL.createObjectURL(imageFile)
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('無法載入圖片'))
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
      } catch (canvasError) {
        throw new Error('無法處理圖片：' + (embedError.message || '圖片格式不支援或已損壞'))
      }
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
    console.error('添加圖片錯誤:', error)
    throw error
  }
}

// 添加矩形到 PDF
export async function addRectangleToPDF(pdfDoc, pageIndex, x, y, width, height, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const borderColor = options.borderColor || rgb(0, 0, 0)
    const borderWidth = options.borderWidth || 1
    const fillColor = options.fillColor || null
    
    if (fillColor) {
      page.drawRectangle({
        x: x,
        y: y,
        width: width,
        height: height,
        borderColor: borderColor,
        borderWidth: borderWidth,
        color: fillColor,
      })
    } else {
      page.drawRectangle({
        x: x,
        y: y,
        width: width,
        height: height,
        borderColor: borderColor,
        borderWidth: borderWidth,
      })
    }
    
    return pdfDoc
  } catch (error) {
    console.error('添加矩形錯誤:', error)
    throw error
  }
}

// 添加圓形到 PDF
export async function addCircleToPDF(pdfDoc, pageIndex, x, y, radius, options = {}) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    const borderColor = options.borderColor || rgb(0, 0, 0)
    const borderWidth = options.borderWidth || 1
    const fillColor = options.fillColor || null
    
    if (fillColor) {
      page.drawCircle({
        x: x,
        y: y,
        size: radius,
        borderColor: borderColor,
        borderWidth: borderWidth,
        color: fillColor,
      })
    } else {
      page.drawCircle({
        x: x,
        y: y,
        size: radius,
        borderColor: borderColor,
        borderWidth: borderWidth,
      })
    }
    
    return pdfDoc
  } catch (error) {
    console.error('添加圓形錯誤:', error)
    throw error
  }
}

// 旋轉頁面
export async function rotatePage(pdfDoc, pageIndex, angle) {
  try {
    const pages = pdfDoc.getPages()
    const page = pages[pageIndex]
    
    if (!page) {
      throw new Error('頁面不存在')
    }
    
    // 獲取當前旋轉角度
    const rotation = page.getRotation()
    const currentRotation = rotation ? rotation.angle : 0
    const newRotation = (currentRotation + angle) % 360
    page.setRotation({ angle: newRotation })
    
    return pdfDoc
  } catch (error) {
    console.error('旋轉頁面錯誤:', error)
    throw error
  }
}

// 刪除頁面
export async function deletePage(pdfDoc, pageIndex) {
  try {
    pdfDoc.removePage(pageIndex)
    return pdfDoc
  } catch (error) {
    console.error('刪除頁面錯誤:', error)
    throw error
  }
}

// 保存編輯後的 PDF
export async function saveEditedPDF(pdfDoc, filename = 'edited.pdf') {
  try {
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    saveAs(blob, filename)
    return blob
  } catch (error) {
    console.error('保存 PDF 錯誤:', error)
    throw error
  }
}

// 獲取 PDF 頁面尺寸
export function getPageSize(page) {
  const { width, height } = page.getSize()
  return { width, height }
}

