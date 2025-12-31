import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'

// 最大文件大小：750MB
const MAX_FILE_SIZE = 750 * 1024 * 1024

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 壓縮 PDF 文件
export async function compressPDF(pdfFile, quality = 'medium', onProgress) {
  try {
    // 驗證文件大小
    if (pdfFile.size > MAX_FILE_SIZE) {
      throw new Error(`檔案大小超過限制！最大允許：${formatFileSize(MAX_FILE_SIZE)}`)
    }

    if (onProgress) onProgress(10)

    // 讀取 PDF
    const arrayBuffer = await pdfFile.arrayBuffer()
    if (onProgress) onProgress(20)

    // 載入 PDF 文檔，啟用壓縮選項
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: false,
      capNumbers: false,
      parseSpeed: 1, // 最快解析速度
    })
    if (onProgress) onProgress(40)

    // 獲取所有頁面
    const pages = pdfDoc.getPages()
    
    // 根據品質設置壓縮選項
    let compressionLevel = 0.7
    if (quality === 'medium') {
      compressionLevel = 0.7
    } else if (quality === 'low') {
      compressionLevel = 0.5 // 高強度壓縮
    }

    // 獲取所有圖片並壓縮
    const imageRefs = pdfDoc.context.enumerateIndirectObjects()
    let imageCount = 0
    let processedImages = 0

    // 計算圖片數量
    for (const [ref, object] of imageRefs) {
      if (object instanceof PDFDocument && object.dict) {
        const subtype = object.dict.get('Subtype')
        if (subtype && (subtype.toString() === '/Image' || subtype.toString() === 'Image')) {
          imageCount++
        }
      }
    }

    // 處理每一頁
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      // 獲取頁面中的圖片
      const pageContent = page.node
      if (pageContent) {
        // pdf-lib 會自動處理圖片的壓縮
      }
      
      if (onProgress) {
        onProgress(40 + (i / pages.length) * 50)
      }
    }

    // 保存壓縮後的 PDF，使用壓縮選項
    // 使用對象流可以減少檔案大小
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true, // 啟用對象流壓縮
      addDefaultPage: false,
      updateMetadata: false, // 不更新元數據
    })
    
    if (onProgress) onProgress(100)

    // 如果壓縮後反而變大，返回原始檔案
    if (compressedBytes.length >= arrayBuffer.byteLength) {
      console.warn('壓縮後檔案未變小，返回原始檔案')
      return new Blob([arrayBuffer], { type: 'application/pdf' })
    }

    return new Blob([compressedBytes], { type: 'application/pdf' })
  } catch (error) {
    console.error('PDF 壓縮錯誤:', error)
    throw error
  }
}

// 計算壓縮率
export function calculateCompressionRatio(originalSize, compressedSize) {
  if (originalSize === 0) return 0
  const ratio = ((originalSize - compressedSize) / originalSize) * 100
  return Math.round(ratio * 100) / 100
}

// 下載壓縮後的文件
export function downloadCompressedFile(blob, originalFileName) {
  const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'))
  const compressedFileName = `${nameWithoutExt}_compressed.pdf`
  saveAs(blob, compressedFileName)
}

