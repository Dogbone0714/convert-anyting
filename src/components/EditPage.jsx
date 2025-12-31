import React, { useState, useRef, useEffect } from 'react'
import { formatFileSize } from '../utils/pdfCompressor'
import {
  loadPDFForEditing,
  renderPageToImage,
  addTextToPDF,
  addImageToPDF,
  addRectangleToPDF,
  addCircleToPDF,
  rotatePage,
  deletePage,
  saveEditedPDF,
  getPageSize
} from '../utils/pdfEditor'
import { rgb } from 'pdf-lib'

function EditPage() {
  const [file, setFile] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageImages, setPageImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [activeTool, setActiveTool] = useState(null) // 'text', 'image', 'rectangle', 'circle', 'select'
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [showTextInput, setShowTextInput] = useState(false)
  const [pageElements, setPageElements] = useState({}) // 追蹤每頁的元素 { pageIndex: [{ type, x, y, width, height, data, id }] }
  const [selectedElement, setSelectedElement] = useState(null) // 當前選中的元素 { pageIndex, elementId }
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const canvasRefs = useRef([])
  const previewContainerRef = useRef(null)

  const MAX_FILE_SIZE = 750 * 1024 * 1024

  const validateFile = (selectedFile) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `檔案大小超過限制！\n檔案：${selectedFile.name}\n大小：${formatFileSize(selectedFile.size)}\n最大允許：${formatFileSize(MAX_FILE_SIZE)}`
      }
    }
    return { valid: true }
  }

  const handleFileSelect = async (selectedFile) => {
    setError(null)
    
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('請選擇 PDF 檔案！')
      return
    }

    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.message)
      setFile(null)
      return
    }
    
    setIsLoading(true)
    setFile(selectedFile)

    try {
      const { pdfDoc: doc, pdf: pdfJs, numPages: pages } = await loadPDFForEditing(selectedFile)
      setPdfDoc(doc)
      setPdf(pdfJs)
      setNumPages(pages)
      setCurrentPage(0)

      // 渲染所有頁面
      const images = []
      for (let i = 1; i <= pages; i++) {
        const result = await renderPageToImage(pdfJs, i, 1.0)
        images.push(result.dataURL)
      }
      setPageImages(images)
    } catch (err) {
      setError('載入 PDF 失敗：' + err.message)
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handlePageClick = (e, pageIndex) => {
    if (activeTool === 'text' && pdfDoc) {
      e.stopPropagation()
      const img = e.currentTarget
      const rect = img.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      // 獲取 PDF 頁面尺寸
      const pages = pdfDoc.getPages()
      const page = pages[currentPage]
      const { width: pageWidth, height: pageHeight } = getPageSize(page)
      
      // 獲取圖片的自然尺寸和顯示尺寸
      const naturalWidth = img.naturalWidth || img.width || rect.width
      const naturalHeight = img.naturalHeight || img.height || rect.height
      const displayWidth = rect.width
      const displayHeight = rect.height
      
      // 計算縮放比例（考慮圖片的實際渲染尺寸）
      const scaleX = pageWidth / naturalWidth
      const scaleY = pageHeight / naturalHeight
      
      // 將點擊位置轉換為圖片自然座標
      const imgX = (clickX / displayWidth) * naturalWidth
      const imgY = (clickY / displayHeight) * naturalHeight
      
      // 轉換為 PDF 座標系統（從左下角開始，Y 軸向上）
      const x = imgX * scaleX
      const y = pageHeight - (imgY * scaleY) // PDF 座標系統是從下往上
      
      setTextPosition({ x, y })
      setShowTextInput(true)
    }
  }

  // 重新載入 PDF 以更新預覽
  const reloadPDFPreview = async () => {
    try {
      // 保存當前編輯的 PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const newFile = new File([blob], file.name, { type: 'application/pdf' })
      
      // 重新載入 PDF
      const { pdfDoc: newDoc, pdf: newPdf, numPages: pages } = await loadPDFForEditing(newFile)
      setPdfDoc(newDoc)
      setPdf(newPdf)
      
      // 重新渲染所有頁面
      const images = []
      for (let i = 1; i <= pages; i++) {
        const result = await renderPageToImage(newPdf, i, 1.0)
        images.push(result.dataURL)
      }
      setPageImages(images)
      
      // 重新同步元素位置（如果頁面數量改變）
      const newElements = { ...pageElements }
      for (let i = 0; i < pages; i++) {
        if (!newElements[i]) {
          newElements[i] = []
        }
      }
      // 移除超出頁數的元素
      Object.keys(newElements).forEach(key => {
        if (parseInt(key) >= pages) {
          delete newElements[key]
        }
      })
      setPageElements(newElements)
    } catch (err) {
      console.error('重新載入預覽失敗:', err)
      setError('更新預覽失敗：' + err.message)
    }
  }

  const handleAddText = async () => {
    if (!textInput.trim() || !pdfDoc) return

    try {
      // 如果沒有點擊位置，使用預設位置
      let x = textPosition.x
      let y = textPosition.y
      
      if (!x && !y) {
        // 使用預設位置（頁面左上角）
        const pages = pdfDoc.getPages()
        const page = pages[currentPage]
        const { width, height } = getPageSize(page)
        x = 50
        y = height - 50
      }

      await addTextToPDF(pdfDoc, currentPage, textInput, x, y, {
        fontSize: 12,
        color: rgb(0, 0, 0)
      })

      // 重新載入 PDF 預覽以顯示更新
      await reloadPDFPreview()

      setTextInput('')
      setShowTextInput(false)
      setActiveTool(null)
      setTextPosition({ x: 0, y: 0 })
    } catch (err) {
      console.error('添加文字錯誤:', err)
      setError('添加文字失敗：' + err.message)
    }
  }

  const handleAddImage = async (imageFile) => {
    if (!pdfDoc || !imageFile) return

    try {
      const pages = pdfDoc.getPages()
      const page = pages[currentPage]
      const { width, height } = getPageSize(page)

      const imageX = 50
      const imageY = height - 150
      const imageWidth = 100
      const imageHeight = 100

      await addImageToPDF(pdfDoc, currentPage, imageFile, imageX, imageY, {
        width: imageWidth,
        height: imageHeight
      })

      // 添加圖片到元素追蹤
      const elementId = `img_${Date.now()}_${Math.random()}`
      const newElements = { ...pageElements }
      if (!newElements[currentPage]) {
        newElements[currentPage] = []
      }
      newElements[currentPage].push({
        id: elementId,
        type: 'image',
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        file: imageFile,
        pageIndex: currentPage
      })
      setPageElements(newElements)

      // 重新載入 PDF 預覽以顯示更新
      await reloadPDFPreview()

      setActiveTool('select')
      setSelectedElement({ pageIndex: currentPage, elementId })
    } catch (err) {
      setError('添加圖片失敗：' + err.message)
    }
  }

  // 處理元素選擇
  const handleElementClick = (e, element) => {
    e.stopPropagation()
    setSelectedElement({ pageIndex: currentPage, elementId: element.id })
    setActiveTool('select')
  }

  // 處理元素拖動開始
  const handleElementDragStart = (e, element) => {
    e.stopPropagation()
    if (selectedElement?.elementId !== element.id) {
      setSelectedElement({ pageIndex: currentPage, elementId: element.id })
    }
    setIsDraggingElement(true)
    
    const rect = previewContainerRef.current?.getBoundingClientRect()
    if (rect) {
      const img = previewContainerRef.current?.querySelector('img')
      if (img) {
        const imgRect = img.getBoundingClientRect()
        const pages = pdfDoc.getPages()
        const page = pages[currentPage]
        const { width: pageWidth, height: pageHeight } = getPageSize(page)
        
        const scaleX = pageWidth / (img.naturalWidth || imgRect.width)
        const scaleY = pageHeight / (img.naturalHeight || imgRect.height)
        
        const clickX = (e.clientX - imgRect.left) * scaleX
        const clickY = pageHeight - ((e.clientY - imgRect.top) * scaleY)
        
        setDragOffset({
          x: clickX - element.x,
          y: clickY - element.y
        })
      }
    }
  }

  // 處理元素拖動
  const handleElementDrag = (e) => {
    if (!isDraggingElement || !selectedElement || !pdfDoc) return
    
    const element = pageElements[currentPage]?.find(el => el.id === selectedElement.elementId)
    if (!element) return

    const img = previewContainerRef.current?.querySelector('img')
    if (!img) return

    const imgRect = img.getBoundingClientRect()
    const pages = pdfDoc.getPages()
    const page = pages[currentPage]
    const { width: pageWidth, height: pageHeight } = getPageSize(page)
    
    const scaleX = pageWidth / (img.naturalWidth || imgRect.width)
    const scaleY = pageHeight / (img.naturalHeight || imgRect.height)
    
    const newX = (e.clientX - imgRect.left) * scaleX - dragOffset.x
    const newY = pageHeight - ((e.clientY - imgRect.top) * scaleY) - dragOffset.y
    
    // 更新元素位置
    const newElements = { ...pageElements }
    const elementIndex = newElements[currentPage].findIndex(el => el.id === element.id)
    if (elementIndex !== -1) {
      newElements[currentPage][elementIndex] = {
        ...element,
        x: Math.max(0, Math.min(pageWidth - element.width, newX)),
        y: Math.max(0, Math.min(pageHeight - element.height, newY))
      }
      setPageElements(newElements)
    }
  }

  // 處理元素拖動結束
  const handleElementDragEnd = async () => {
    if (!isDraggingElement || !selectedElement || !pdfDoc) return
    
    setIsDraggingElement(false)
    
    // 更新 PDF 中的圖片位置
    const element = pageElements[currentPage]?.find(el => el.id === selectedElement.elementId)
    if (element && element.type === 'image') {
      try {
        // 重新創建頁面（移除舊圖片，添加新位置圖片）
        // 由於 pdf-lib 不支援直接移動，我們需要重新添加圖片
        await addImageToPDF(pdfDoc, currentPage, element.file, element.x, element.y, {
          width: element.width,
          height: element.height
        })
        
        // 重新載入預覽
        await reloadPDFPreview()
      } catch (err) {
        console.error('更新圖片位置失敗:', err)
        setError('更新圖片位置失敗：' + err.message)
      }
    }
  }

  // 處理點擊空白處取消選擇
  const handlePreviewClick = (e) => {
    if (e.target.tagName === 'IMG' && activeTool !== 'text') {
      setSelectedElement(null)
    }
  }

  const handleAddShape = async (shapeType) => {
    if (!pdfDoc) return

    try {
      const pages = pdfDoc.getPages()
      const page = pages[currentPage]
      const { width, height } = getPageSize(page)

      if (shapeType === 'rectangle') {
        await addRectangleToPDF(pdfDoc, currentPage, 50, height - 150, 100, 50, {
          borderColor: rgb(1, 0, 0),
          borderWidth: 2
        })
      } else if (shapeType === 'circle') {
        await addCircleToPDF(pdfDoc, currentPage, 100, height - 100, 30, {
          borderColor: rgb(0, 0, 1),
          borderWidth: 2
        })
      }

      // 重新載入 PDF 預覽以顯示更新
      await reloadPDFPreview()

      setActiveTool(null)
    } catch (err) {
      setError('添加形狀失敗：' + err.message)
    }
  }

  const handleRotatePage = async () => {
    if (!pdfDoc) return

    try {
      await rotatePage(pdfDoc, currentPage, 90)

      // 重新載入 PDF 預覽以顯示更新
      await reloadPDFPreview()
    } catch (err) {
      setError('旋轉頁面失敗：' + err.message)
    }
  }

  const handleDeletePage = async () => {
    if (!pdfDoc || numPages <= 1) {
      setError('無法刪除最後一頁')
      return
    }

    try {
      await deletePage(pdfDoc, currentPage)
      setNumPages(numPages - 1)
      
      // 重新載入 PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const newFile = new File([blob], file.name, { type: 'application/pdf' })
      
      await handleFileSelect(newFile)
      
      if (currentPage >= numPages - 1) {
        setCurrentPage(Math.max(0, numPages - 2))
      }
    } catch (err) {
      setError('刪除頁面失敗：' + err.message)
    }
  }

  const handleSave = async () => {
    if (!pdfDoc || !file) return

    try {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
      await saveEditedPDF(pdfDoc, `${nameWithoutExt}_edited.pdf`)
    } catch (err) {
      setError('保存失敗：' + err.message)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPdfDoc(null)
    setPdf(null)
    setNumPages(0)
    setCurrentPage(0)
    setPageImages([])
    setError(null)
    setActiveTool(null)
    setTextInput('')
    setShowTextInput(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="edit-page">
      <div className="container">
        <h1 className="page-title">PDF 編輯器</h1>
        
        {/* 上傳區域 */}
        {!file && (
          <div
            className={`upload-area ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <div className="upload-icon">
              <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 左邊：表格文件 */}
                <rect x="8" y="20" width="32" height="42" fill="none" stroke="white" strokeWidth="2" rx="2"/>
                <path d="M 12 28 L 36 28" stroke="white" strokeWidth="1.5"/>
                <path d="M 12 34 L 36 34" stroke="white" strokeWidth="1.5"/>
                <path d="M 12 40 L 36 40" stroke="white" strokeWidth="1.5"/>
                <path d="M 12 46 L 36 46" stroke="white" strokeWidth="1.5"/>
                <path d="M 20 24 L 20 58" stroke="white" strokeWidth="1.5"/>
                <path d="M 28 24 L 28 58" stroke="white" strokeWidth="1.5"/>
                
                {/* 中間：PDF 文件 */}
                <rect x="40" y="15" width="36" height="48" fill="none" stroke="white" strokeWidth="2.5" rx="2"/>
                <rect x="46" y="48" width="24" height="8" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1" rx="1"/>
                <text x="52" y="54" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">PDF</text>
                <line x1="46" y1="28" x2="70" y2="28" stroke="white" strokeWidth="1.5"/>
                <line x1="46" y1="34" x2="68" y2="34" stroke="white" strokeWidth="1.5"/>
                <line x1="46" y1="40" x2="70" y2="40" stroke="white" strokeWidth="1.5"/>
                
                {/* 右邊：圖表文件 */}
                <rect x="72" y="10" width="32" height="42" fill="none" stroke="white" strokeWidth="2" rx="2"/>
                <circle cx="88" cy="28" r="10" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.5"/>
                <path d="M 88 18 A 10 10 0 0 1 88 28 L 88 18" fill="white"/>
                <line x1="88" y1="28" x2="88" y2="18" stroke="white" strokeWidth="1.5"/>
                <line x1="88" y1="28" x2="96" y2="28" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="upload-button-wrapper">
              <button 
                className="btn-select-file" 
                onClick={(e) => {
                  e.stopPropagation()
                  if (fileInputRef.current) {
                    fileInputRef.current.click()
                  }
                }}
              >
                + 選取檔案
                <span className="dropdown-arrow">▼</span>
              </button>
            </div>
            <p className="upload-hint">或拖曳檔案到此處</p>
          </div>
        )}

        {/* 編輯器界面 */}
        {file && pdfDoc && (
          <div className="pdf-editor-container">
            {/* 工具欄 */}
            <div className="editor-toolbar">
              <div className="toolbar-section">
                <h3>編輯工具</h3>
                <div className="tool-buttons">
                  <button
                    className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTool(activeTool === 'text' ? null : 'text')
                      setShowTextInput(false)
                    }}
                  >
                    📝 添加文字
                  </button>
                  <button
                    className={`tool-btn ${activeTool === 'image' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTool(activeTool === 'image' ? null : 'image')
                      imageInputRef.current?.click()
                    }}
                  >
                    🖼️ 添加圖片
                  </button>
                  <button
                    className="tool-btn"
                    onClick={() => handleAddShape('rectangle')}
                  >
                    ▭ 添加矩形
                  </button>
                  <button
                    className="tool-btn"
                    onClick={() => handleAddShape('circle')}
                  >
                    ⭕ 添加圓形
                  </button>
                </div>
              </div>

              <div className="toolbar-section">
                <h3>頁面操作</h3>
                <div className="tool-buttons">
                  <button
                    className="tool-btn"
                    onClick={handleRotatePage}
                  >
                    🔄 旋轉頁面
                  </button>
                  <button
                    className="tool-btn danger"
                    onClick={handleDeletePage}
                    disabled={numPages <= 1}
                  >
                    🗑️ 刪除頁面
                  </button>
                </div>
              </div>

              <div className="toolbar-section">
                <div className="tool-buttons">
                  <button
                    className="tool-btn primary"
                    onClick={handleSave}
                  >
                    💾 保存 PDF
                  </button>
                  <button
                    className="tool-btn"
                    onClick={handleReset}
                  >
                    🔄 重新選擇
                  </button>
                </div>
              </div>
            </div>

            {/* PDF 預覽區域 */}
            <div className="pdf-preview-area">
              <div className="page-navigation">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  ← 上一頁
                </button>
                <span>第 {currentPage + 1} 頁 / 共 {numPages} 頁</span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages - 1, currentPage + 1))}
                  disabled={currentPage === numPages - 1}
                >
                  下一頁 →
                </button>
              </div>

              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>載入中...</p>
                </div>
              ) : (
                <div 
                  className="page-preview" 
                  ref={previewContainerRef}
                  onClick={handlePreviewClick}
                  onMouseMove={handleElementDrag}
                  onMouseUp={handleElementDragEnd}
                  onMouseLeave={handleElementDragEnd}
                  style={{ position: 'relative' }}
                >
                  {pageImages[currentPage] && (
                    <>
                      <img
                        src={pageImages[currentPage]}
                        alt={`Page ${currentPage + 1}`}
                        onClick={(e) => handlePageClick(e, currentPage)}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          border: '1px solid #ddd',
                          cursor: activeTool === 'text' ? 'crosshair' : 'default',
                          display: 'block'
                        }}
                      />
                      {/* 元素覆蓋層 */}
                      {pageElements[currentPage]?.map((element) => {
                        const img = previewContainerRef.current?.querySelector('img')
                        if (!img) return null
                        
                        const imgRect = img.getBoundingClientRect()
                        const pages = pdfDoc.getPages()
                        const page = pages[currentPage]
                        const { width: pageWidth, height: pageHeight } = getPageSize(page)
                        
                        const scaleX = (img.naturalWidth || imgRect.width) / pageWidth
                        const scaleY = (img.naturalHeight || imgRect.height) / pageHeight
                        
                        const displayX = (element.x * scaleX)
                        const displayY = (pageHeight - element.y - element.height) * scaleY
                        const displayWidth = element.width * scaleX
                        const displayHeight = element.height * scaleY
                        
                        const isSelected = selectedElement?.elementId === element.id
                        
                        return (
                          <div
                            key={element.id}
                            onClick={(e) => handleElementClick(e, element)}
                            onMouseDown={(e) => handleElementDragStart(e, element)}
                            style={{
                              position: 'absolute',
                              left: `${displayX}px`,
                              top: `${displayY}px`,
                              width: `${displayWidth}px`,
                              height: `${displayHeight}px`,
                              border: isSelected ? '2px solid #4D96FF' : '2px dashed #ccc',
                              backgroundColor: isSelected ? 'rgba(77, 150, 255, 0.1)' : 'transparent',
                              cursor: 'move',
                              pointerEvents: 'auto',
                              boxSizing: 'border-box'
                            }}
                          >
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '-25px',
                                left: '0',
                                background: '#4D96FF',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}>
                                {element.type === 'image' ? '圖片' : element.type}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* 文字輸入框 */}
              {showTextInput && (
                <div className="text-input-overlay">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="輸入文字..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddText()
                      } else if (e.key === 'Escape') {
                        setShowTextInput(false)
                        setTextInput('')
                        setActiveTool(null)
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '2px solid #4D96FF',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={handleAddText}
                      style={{
                        padding: '6px 12px',
                        background: '#4D96FF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      添加
                    </button>
                    <button
                      onClick={() => {
                        setShowTextInput(false)
                        setTextInput('')
                        setActiveTool(null)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 隱藏的圖片輸入 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files.length > 0) {
              handleAddImage(e.target.files[0])
            }
          }}
          style={{ display: 'none' }}
        />

        {error && (
          <div className="error-message" style={{ marginTop: '20px' }}>
            <p style={{ color: '#ff6b6b', fontSize: '14px', margin: '10px 0' }}>
              ⚠️ {error}
            </p>
            <button
              onClick={() => setError(null)}
              style={{
                padding: '8px 16px',
                background: '#ff6b6b',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              關閉
            </button>
          </div>
        )}

        {/* 主要內容區域 */}
        {!file && (
          <div className="edit-content">
            {/* 描述文字 */}
            <div className="edit-description">
              <p>
                一個多合一的線上 PDF 編輯器，可供您用於編輯文字或是新增圖像、形狀、醒目提示和隨手註釋到文件中。助您輕鬆編輯檔案好在能更短的時間內完成更多工作，就是這麼簡單，讓您能把心力投注在重要的工作上。
              </p>
              <div className="edit-benefits">
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  <span>輕鬆在 Mac、Windows 或是行動裝置上編輯 PDF 檔案</span>
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  <span>透過雲端空間來整理您的文件</span>
                </div>
              </div>
            </div>

            {/* 其他內容區塊 */}
            <section className="edit-section">
              <h2 className="section-title">輕輕鬆鬆編輯您的 PDF</h2>
              <p className="section-text">
                檔案工作不該是艱深晦澀的。這就是我們簡化 PDF 編輯工作的原因，這樣您便可以自由靈活地對工作檔案進行各式操作。
              </p>
            </section>

            <section className="edit-section">
              <h2 className="section-title">強大的 PDF 編輯工具–易如反掌</h2>
              <p className="section-text">
                說到「編輯 PDF」，我們可沒在開玩笑的。看是要新增全新文字、編輯現有文字、醒目提示、繪製、插入形狀和圖像——無論您需要什麼，我們都能滿足您的需求。工具使用起來非常簡單，無需事先設定或安排初學訓練。大家都可以立即開始。
              </p>
            </section>

            <section className="edit-section">
              <h2 className="section-title">文件整理快覽</h2>
              <p className="section-text">
                透過整理模式來進行重新排列、合併、解壓縮、分割等安排。使用多種類型的匯出選項，以您喜歡的任何檔案格式儲存文件。此外，您還可以壓縮或壓平合併您的 PDF — 您的文件，您做主。
              </p>
            </section>

            <section className="edit-section">
              <h2 className="section-title">快速保存、輕鬆分享</h2>
              <p className="section-text">
                施展了魔法並完成編輯您的 PDF 了嗎？只需將編輯後的文件保存到 Convert Anything、您的裝置或任何有與我們連接的 App（例如 Dropbox 或 G Suite）中即可，或是通過快速下載連結共享。
              </p>
            </section>

            <section className="edit-section">
              <h2 className="section-title">如何免費在線上編輯 PDF 檔案</h2>
              <ol className="steps-list">
                <li>將您的 PDF 檔案匯入或拖放到我們的編輯工具中。</li>
                <li>如果有需要的話，您可以新增文字、圖像、形狀、標記或電子簽名等等的項目。</li>
                <li>如有需要的話，亦可整理文件頁面。</li>
                <li>點擊以將您的檔案 「匯出」為 PDF 或其他的檔案類型。</li>
                <li>大功告成後，即可下載您編輯完成的 PDF 檔案—就是這麼簡單！</li>
              </ol>
            </section>

            <section className="edit-section">
              <h2 className="section-title">線上編輯 PDF – 快速簡便</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🚀</div>
                  <h3 className="feature-title">強大無比的工具–無須任何使用教程</h3>
                  <p className="feature-text">
                    工具就是如此簡單，您和您的團隊無需預先閱讀或學習任何內容即可開始使用。只需上傳您的文件即可開始編輯。
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3 className="feature-title">輕鬆切換工具和轉換文件類型</h3>
                  <p className="feature-text">
                    在其他 30 多種 PDF 工具之間快速切換，將文件壓縮或匯出為 Word、Excel、PowerPoint 或 JPG 檔案。
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3 className="feature-title">隨時隨地編輯檔案</h3>
                  <p className="feature-text">
                    不必再窩在辦公桌前工作。使用 Convert Anything 的 PDF 編輯工具，您可以在任何裝置上編輯 PDF 檔案，無論是桌上型電腦、平板電腦還是智慧型手機。
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditPage
