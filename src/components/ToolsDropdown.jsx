import React, { useState, useRef, useEffect, useContext } from 'react'
import { PageContext } from '../App'

function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef(null)
  const pageContext = useContext(PageContext)
  const setCurrentPage = pageContext?.setCurrentPage || (() => {})

  const tools = {
    compress: [
      { name: '壓縮PDF', icon: '', color: '#FF6B6B' }
    ],
    convert: [
    ],
    organize: [
      { name: '合併PDF', icon: '', color: '#9B59B6' },
      { name: '分割PDF', icon: '', color: '#9B59B6' },
      { name: '旋轉PDF', icon: '', color: '#9B59B6' },
      { name: '刪除PDF頁面', icon: '', color: '#9B59B6' },
      { name: '擷取 PDF 頁面', icon: '', color: '#9B59B6' },
      { name: '組織 PDF', icon: '', color: '#9B59B6' }
    ],
    viewEdit: [
      { name: 'PDF註解工具', icon: '', color: '#4ECDC4' },
      { name: 'PDF閱讀器', icon: '', color: '#4ECDC4' },
      { name: '頁碼', icon: '', color: '#4ECDC4' },
      { name: '裁剪 PDF', icon: '', color: '#4ECDC4' },
      { name: '修訂 PDF', icon: '', color: '#4ECDC4' },
      { name: '為PDF加上浮水印', icon: '', color: '#4ECDC4' },
      { name: 'PDF表格填寫', icon: '', color: '#4ECDC4' },
      { name: '共享 PDF', icon: '', color: '#4ECDC4' }
    ],
    fromPDF: [
      { name: 'PDF轉Word', icon: 'W', color: '#4D96FF' },
      { name: 'PDF轉Excel', icon: 'X', color: '#6BCB77' },
      { name: 'PDF轉PPT', icon: 'P', color: '#FF9500' },
      { name: 'PDF轉JPG', icon: 'J', color: '#FFD93D' }
    ],
    toPDF: [
      { name: 'Word轉PDF', icon: 'W', color: '#4D96FF' },
      { name: 'Excel轉PDF', icon: 'X', color: '#6BCB77' },
      { name: 'PPT轉PDF', icon: 'P', color: '#FF9500' },
      { name: 'JPG轉PDF', icon: 'J', color: '#FFD93D' },
      { name: 'PDF OCR', icon: 'O', color: '#FF6B6B' }
    ],
    more: [
      { name: '解密PDF', icon: '', color: '#FF6B6B' },
      { name: '加密PDF', icon: '', color: '#FF6B6B' },
      { name: '平面化 PDF', icon: '', color: '#FF6B6B' }
    ],
    scan: [
      { name: 'PDF掃描器', icon: '', color: '#4D96FF' }
    ]
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleToolClick = (e, toolName) => {
    e.preventDefault()
    setIsOpen(false)
    
    // 根據工具名稱切換頁面
    if (toolName === '壓縮PDF') {
      setCurrentPage('compress')
    } else if (toolName === 'PDF轉換器') {
      setCurrentPage('convert')
    } else if (toolName === '合併PDF') {
      setCurrentPage('merge')
    } else {
      // 其他功能尚未實現，顯示提示
      alert(`${toolName} 功能即將推出！`)
    }
  }

  return (
    <div 
      className="nav-item dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a href="#" className="nav-link">
        工具 <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </a>
      {isOpen && (
        <div 
          className="dropdown-menu"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="dropdown-content">
            {/* 壓縮 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">壓縮</h4>
              {tools.compress.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className={`dropdown-item ${tool.highlight ? 'highlight' : ''}`}
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 整理 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">整理</h4>
              {tools.organize.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 檢視&編輯 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">檢視&編輯</h4>
              {tools.viewEdit.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 從PDF轉換 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">從PDF轉換</h4>
              {tools.fromPDF.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 轉換成PDF */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">轉換成PDF</h4>
              {tools.toPDF.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 更多 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">更多</h4>
              {tools.more.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>

            {/* 掃描 */}
            <div className="dropdown-column">
              <h4 className="dropdown-category">掃描</h4>
              {tools.scan.map((tool, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="dropdown-item"
                  onClick={(e) => handleToolClick(e, tool.name)}
                >
                  {tool.icon && <span className="tool-icon" style={{ color: tool.color }}>{tool.icon}</span>}
                  <span>{tool.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolsDropdown

