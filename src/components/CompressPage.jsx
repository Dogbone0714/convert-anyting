import React, { useState, useRef } from 'react'
import { compressPDF, downloadCompressedFile, formatFileSize, calculateCompressionRatio } from '../utils/pdfCompressor'

function CompressPage() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState('medium')
  const [compressionResult, setCompressionResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 750 * 1024 * 1024

  const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `檔案大小超過限制！\n檔案：${file.name}\n大小：${formatFileSize(file.size)}\n最大允許：${formatFileSize(MAX_FILE_SIZE)}`
      }
    }
    return { valid: true }
  }

  const handleFileSelect = (selectedFile) => {
    setError(null)
    setCompressionResult(null)
    
    if (!selectedFile) return
    
    // 檢查是否為 PDF
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('請選擇 PDF 檔案！')
      return
    }

    const validation = validateFileSize(selectedFile)
    if (!validation.valid) {
      setError(validation.message)
      setFile(null)
      return
    }
    
    setFile(selectedFile)
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

  const handleCompress = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setCompressionResult(null)

    try {
      const compressedBlob = await compressPDF(file, quality, (progressValue) => {
        setProgress(progressValue)
      })

      const originalSize = file.size
      const compressedSize = compressedBlob.size
      const compressionRatio = calculateCompressionRatio(originalSize, compressedSize)

      setCompressionResult({
        originalSize,
        compressedSize,
        compressionRatio,
        blob: compressedBlob
      })

      // 自動下載
      downloadCompressedFile(compressedBlob, file.name)

      setIsProcessing(false)
    } catch (error) {
      console.error('壓縮失敗:', error)
      setError('壓縮失敗：' + error.message)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleReset = () => {
    setFile(null)
    setCompressionResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="compress-page">
      <div className="container">
        <h1 className="page-title">壓縮 PDF</h1>
        
        {/* 上傳區域 */}
        <div
          className={`upload-area ${isDragging ? 'dragover' : ''} ${isProcessing ? 'processing' : ''} ${compressionResult ? 'success' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {!file && !isProcessing && (
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
                    if (!isProcessing && !file && fileInputRef.current) {
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

          {file && !isProcessing && !compressionResult && (
            <div className="file-info">
              <div className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              <div className="quality-selector">
                <label style={{ color: 'white', marginBottom: '10px', display: 'block' }}>
                  壓縮級別：
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '6px',
                    border: '2px solid white',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="medium">基本壓縮</option>
                  <option value="low">高強度壓縮</option>
                </select>
              </div>
              <button
                className="format-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCompress()
                }}
                style={{ marginTop: '15px' }}
              >
                🗜️ 開始壓縮
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
              <p>正在壓縮檔案...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{progress}%</p>
            </div>
          )}

          {compressionResult && (
            <div className="compression-result">
              <h3 style={{ color: 'white', marginBottom: '15px' }}>壓縮完成！</h3>
              <div style={{ color: 'white', fontSize: '14px', lineHeight: '2' }}>
                <p>原始大小：{formatFileSize(compressionResult.originalSize)}</p>
                <p>壓縮後大小：{formatFileSize(compressionResult.compressedSize)}</p>
                <p style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  壓縮率：{compressionResult.compressionRatio}%
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
                🔄 壓縮另一個檔案
              </button>
            </div>
          )}
        </div>

        {/* 主要內容區域 */}
        <div className="compress-content">
          {/* 描述文字 */}
          <div className="compress-description">
            <p>
              輕鬆地在線上縮減 PDF 的大小。無論您是自由業者還是企業老闆，我們的工具都可以幫助您以更好、更快、更聰明的方式完成工作。
            </p>
            <div className="compress-benefits">
              <div className="benefit-item">
                <span className="checkmark">✓</span>
                <span>壓縮檔案大小高達99%</span>
              </div>
              <div className="benefit-item">
                <span className="checkmark">✓</span>
                <span>100% 瀏覽器端的 PDF 檔案大小壓縮工具</span>
              </div>
            </div>
          </div>

          {/* 如何免費在線上壓縮 PDF */}
          <section className="compress-section">
            <h2 className="section-title">如何免費在線上壓縮 PDF</h2>
            <ol className="steps-list">
              <li>將您的 PDF 檔案匯入或拖放到我們的壓縮工具中。</li>
              <li>在基本壓縮和高強度壓縮兩個選項之間進行選擇，並點擊「壓縮」。</li>
              <li>如有需要的話，請使用我們其他的工具來編輯 PDF 檔案。</li>
              <li>大功告成後，即可下載或分享壓縮好的 PDF 檔案—就是這麼簡單！</li>
            </ol>
          </section>

          {/* 透過更小的檔案，更有效率地工作 */}
          <section className="compress-section">
            <h2 className="section-title">透過更小的檔案，更有效率地工作</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3 className="feature-title">立即開始，超級方便</h3>
                <p className="feature-text">
                  無需安裝，無需訓練。立即開始使用最簡單的工具來壓縮您的檔案。
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">☁️</div>
                <h3 className="feature-title">跨所有裝置壓縮</h3>
                <p className="feature-text">
                  我們以雲端為基礎，因此，您可以透過任何瀏覽器並在任何裝置上（從桌上型電腦到平板電腦和行動裝置）於線上縮減檔案大小。
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📁</div>
                <h3 className="feature-title">壓縮其他檔案格式</h3>
                <p className="feature-text">
                  壓縮的不僅僅是 PDF。使用該工具可縮減其他文件類型（例如 Word、PPT、Excel、JPG、PNG、GIF 和 TIFF）的大小。
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">資料監管規章</h3>
                <p className="feature-text">
                  Convert Anything 符合 GDPR（歐盟《個人資料保護規章》）標準，這意味著我們將對儲存、收集和處理您的個人資料的方式保持透明。
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default CompressPage

