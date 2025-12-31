import React, { useState, useRef } from 'react'
import { 
  convertFile, 
  downloadFile, 
  formatFileSize, 
  getFileExtension,
  isPDF,
  isWord,
  isExcel,
  isPowerPoint,
  isImage
} from '../utils/pdfConverter'

// 最大文件大小：750MB
const MAX_FILE_SIZE = 750 * 1024 * 1024 // 786432000 bytes

function UploadArea() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showOptions, setShowOptions] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFileSize = (file) => {
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
    const fileArray = Array.from(selectedFiles)
    
    // 驗證每個文件的大小
    for (const file of fileArray) {
      const validation = validateFileSize(file)
      if (!validation.valid) {
        setError(validation.message)
        setFiles([])
        setCurrentFile(null)
        setShowOptions(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
    }
    
    setFiles(fileArray)
    if (fileArray.length > 0) {
      setCurrentFile(fileArray[0])
      setShowOptions(true)
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
      handleFileSelect(droppedFiles)
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleConvert = async (targetFormat) => {
    if (!currentFile) return

    // 再次驗證文件大小（以防萬一）
    const validation = validateFileSize(currentFile)
    if (!validation.valid) {
      setError(validation.message)
      setShowOptions(false)
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setShowOptions(false)
    setError(null)

    try {
      const blob = await convertFile(currentFile, targetFormat, (progressValue) => {
        setProgress(progressValue)
      })

      // 生成輸出文件名
      const originalName = currentFile.name
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
      const outputFileName = `${nameWithoutExt}.${targetFormat}`

      // 下載文件
      downloadFile(blob, outputFileName)

      // 重置狀態
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
        setFiles([])
        setCurrentFile(null)
        setShowOptions(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)
    } catch (error) {
      console.error('轉換失敗:', error)
      alert('轉換失敗：' + error.message)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const getAvailableFormats = (file) => {
    if (!file) return []
    
    const fileName = file.name
    const formats = []

    if (isPDF(fileName)) {
      formats.push(
        { label: 'Word', format: 'docx', icon: '📄' },
        { label: 'Excel', format: 'xlsx', icon: '📊' },
        { label: 'PowerPoint', format: 'pptx', icon: '📽️' },
        { label: 'JPG', format: 'jpg', icon: '🖼️' },
        { label: 'PNG', format: 'png', icon: '🖼️' }
      )
    } else if (isWord(fileName) || isExcel(fileName) || isPowerPoint(fileName) || isImage(fileName)) {
      formats.push({ label: 'PDF', format: 'pdf', icon: '📑' })
    }

    return formats
  }

  const availableFormats = getAvailableFormats(currentFile)

  return (
    <div
      className={`upload-area ${isDragging ? 'dragover' : ''} ${isProcessing ? 'processing' : ''} ${showOptions ? 'success' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && !showOptions && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {!isProcessing && !showOptions && (
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
                if (!isProcessing && !showOptions && fileInputRef.current) {
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
            最大檔案大小：{formatFileSize(MAX_FILE_SIZE)}
          </p>
        </>
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

      {files.length > 0 && !isProcessing && !showOptions && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      {showOptions && availableFormats.length > 0 && (
        <div className="conversion-options">
          <h3>選擇轉換格式：</h3>
          <div className="format-buttons">
            {availableFormats.map((format, index) => (
              <button
                key={index}
                className="format-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleConvert(format.format)
                }}
              >
                {format.icon} {format.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在轉換檔案...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}
    </div>
  )
}

export default UploadArea

