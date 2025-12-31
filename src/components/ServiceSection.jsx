import React from 'react'

function ServiceSection() {
  return (
    <div className="service-section">
      <div className="service-description">
        <p className="description-text">
          全網路第一名完全免費的線上PDF轉換器，能夠輕鬆將您的檔案轉成PDF，或將您的PDF檔轉換成其他的檔型。不需註冊或安裝任何軟體。現在開始轉檔吧！
        </p>
      </div>
      <div className="service-benefits">
        <div className="benefit-item">
          <span className="checkmark">✓</span>
          <span>適用於 Mac、Windows 和其他平台</span>
        </div>
        <div className="benefit-item">
          <span className="checkmark">✓</span>
          <span>不需要下載任何軟體</span>
        </div>
      </div>
    </div>
  )
}

export default ServiceSection

