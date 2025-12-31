import React, { useState, useRef } from 'react'
import { mergePDFs, downloadMergedFile, formatFileSize } from '../utils/pdfMerger'

function MergePage() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mergedResult, setMergedResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 750 * 1024 * 1024

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `檔案大小超過限制！\n檔案：${file.name}\n大小：${formatFileSize(file.size)}\n最大允許：${formatFileSize(MAX_FILE_SIZE)}`
      }
    }
    return { valid: true }
  }

  const handleFileSelect = (selectedFiles) => {
    setError(null)
    setMergedResult(null)
    
    if (!selectedFiles || selectedFiles.length === 0) return

    const fileArray = Array.from(selectedFiles)
    const validFiles = []
    
    for (const file of fileArray) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.message)
        return
      }
      validFiles.push(file)
    }
    
    setFiles(prevFiles => [...prevFiles, ...validFiles])
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
      handleFileSelect(droppedFiles)
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files)
      e.target.value = '' // 重置 input，允許選擇相同檔案
    }
  }

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    setError(null)
  }

  const handleMoveFile = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newFiles = [...files]
      ;[newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]]
      setFiles(newFiles)
    } else if (direction === 'down' && index < files.length - 1) {
      const newFiles = [...files]
      ;[newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]]
      setFiles(newFiles)
    }
  }

  const handleMerge = async () => {
    if (files.length === 0) {
      setError('請至少選擇一個檔案')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setMergedResult(null)

    try {
      const mergedBlob = await mergePDFs(files, (progressValue) => {
        setProgress(progressValue)
      })

      setMergedResult({
        blob: mergedBlob,
        size: mergedBlob.size
      })

      // 自動下載
      downloadMergedFile(mergedBlob, 'merged.pdf')

      setIsProcessing(false)
    } catch (error) {
      console.error('合併失敗:', error)
      setError('合併失敗：' + error.message)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleReset = () => {
    setFiles([])
    setMergedResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="merge-page">
      <div className="container">
        <h1 className="page-title">合併PDF</h1>
        
        {/* 上傳區域 */}
        <div
          className={`upload-area ${isDragging ? 'dragover' : ''} ${isProcessing ? 'processing' : ''} ${mergedResult ? 'success' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && !mergedResult && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {files.length === 0 && !isProcessing && !mergedResult && (
            <>
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
                    if (!isProcessing && fileInputRef.current) {
                      fileInputRef.current.click()
                    }
                  }}
                >
                  + 選取檔案
                  <span className="dropdown-arrow">▼</span>
                </button>
              </div>
              <p className="upload-hint">或拖曳檔案到此處</p>
              <p className="upload-hint" style={{ fontSize: '12px', marginTop: '10px', opacity: 0.8 }}>
                新增PDF 、 圖片、 Word 、 Excel 和 PowerPoint 檔案
              </p>
              <p className="upload-hint" style={{ fontSize: '11px', marginTop: '5px', opacity: 0.7 }}>
                支援的檔案格式：PDF, DOC, XLS, PPT, PNG, JPG
              </p>
            </>
          )}

          {files.length > 0 && !isProcessing && !mergedResult && (
            <div className="file-list-container">
              <div className="file-list-header">
                <h3 style={{ color: 'white', marginBottom: '15px' }}>已選擇的檔案 ({files.length})</h3>
                <button
                  className="btn-add-more"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  + 新增更多檔案
                </button>
              </div>
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item-merge">
                    <div className="file-info-merge">
                      <span className="file-number">{index + 1}</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="file-actions">
                      <button
                        className="btn-move"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveFile(index, 'up')
                        }}
                        disabled={index === 0}
                        title="上移"
                      >
                        ↑
                      </button>
                      <button
                        className="btn-move"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveFile(index, 'down')
                        }}
                        disabled={index === files.length - 1}
                        title="下移"
                      >
                        ↓
                      </button>
                      <button
                        className="btn-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile(index)
                        }}
                        title="移除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="format-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMerge()
                }}
                style={{ marginTop: '20px' }}
              >
                ✓ 完成合併
              </button>
            </div>
          )}

          {error && !isProcessing && (
            <div className="error-message">
              <p style={{ color: 'white', fontSize: '14px', margin: '10px 0', whiteSpace: 'pre-line' }}>
                ⚠️ {error}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setError(null)
                }}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid white',
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

          {isProcessing && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>正在合併檔案...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{Math.round(progress)}%</p>
            </div>
          )}

          {mergedResult && (
            <div className="merge-result">
              <h3 style={{ color: 'white', marginBottom: '15px' }}>合併完成！</h3>
              <div style={{ color: 'white', fontSize: '14px', lineHeight: '2' }}>
                <p>合併後大小：{formatFileSize(mergedResult.size)}</p>
                <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '10px' }}>
                  檔案已自動下載
                </p>
              </div>
              <button
                className="format-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReset()
                }}
                style={{ marginTop: '15px' }}
              >
                🔄 合併更多檔案
              </button>
            </div>
          )}
        </div>

        {/* 主要內容區域 */}
        <div className="merge-content">
          {/* 描述文字 */}
          <div className="merge-description">
            <p>
              無檔案數量限制、無廣告水印 – 一款既免費又美觀，同時讓你隨意合併PDF的工具。
            </p>
            <div className="merge-benefits">
              <div className="benefit-item">
                <span className="checkmark">✓</span>
                <span>將您的 PDF 拖放過來，立即開始 — 就是這麼簡單！</span>
              </div>
              <div className="benefit-item">
                <span className="checkmark">✓</span>
                <span>適用於 Mac、Windows 和其他平台</span>
              </div>
            </div>
          </div>

          {/* 如何合併PDF檔案 */}
          <section className="merge-section">
            <h2 className="section-title">如何合併PDF檔案</h2>
            <p className="section-text">
              將你的PDF或多個PDF拖放到上方的方框內。當頁面出現時，你就可以開始編輯。然後按下方的按鈕下載你的PDF。
            </p>
          </section>

          {/* 如何在線上合併 PDF 檔案 */}
          <section className="merge-section">
            <h2 className="section-title">如何在線上合併 PDF 檔案：</h2>
            <ol className="steps-list">
              <li>將您的 PDF 檔案匯入或拖放到我們的合併工具中。</li>
              <li>如果有需要的話，您可以新增額外的 PDF、圖片或其他相關檔案。</li>
              <li>點擊「完成」以合併您的文件。</li>
              <li>大功告成後，即可下載或分享合併完成的 PDF 檔案—就是這麼簡單！</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}

export default MergePage

