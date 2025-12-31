import React from 'react'

function FeaturesSection() {
  const features = [
    {
      icon: '💡',
      title: '如何轉換？',
      text: '將您的檔案拖曳放至線上PDF轉換器中，便可將Word、Excel、PPT 或圖像檔案轉換成PDF格式，而PDF檔案則可轉換成您選擇的檔案類型。'
    },
    {
      icon: '🔒',
      title: '無需擔心您的資料安全',
      text: '保障您的資料安全是我們的首要任務。我們所有的檔案傳輸都使用高階的 SSL 加密。另外，我們會自動從服務器銷毀所有檔案。'
    },
    {
      icon: '📱',
      title: '支援所有不同設備',
      text: '您不需要註冊或安裝任何軟件。在線 PDF 轉換器支援所有設備和主要的瀏覽器，包括：IE，Firefox，Chrome 和 Opera。'
    },
    {
      icon: '☁️',
      title: '隨時隨地使用',
      text: '只要有互聯網連接，您就可以在任何地方使用此免費的PDF轉換器。Convert Anything PDF 轉換器完全在雲端上運作。'
    }
  ]

  return (
    <div className="features-section">
      {features.map((feature, index) => (
        <div key={index} className="feature-card">
          <div className="feature-icon">{feature.icon}</div>
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-text">{feature.text}</p>
        </div>
      ))}
    </div>
  )
}

export default FeaturesSection

