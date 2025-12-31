import React from 'react'

function HowToSection() {
  return (
    <div className="how-to-section">
      <h2 className="section-title">如何將檔案轉換為 PDF 檔？或將檔案自 PDF 檔轉換為其他檔案類型：</h2>
      <ol className="steps-list">
        <li>將您的 PDF 檔案匯入或拖放到我們的轉換工具中。</li>
        <li>選擇是要轉換為 Word、Excel、 PowerPoint 或圖片檔。</li>
        <li>如有需要的話，亦可選擇進行 OCR 辨識或擷取圖片（Pro 功能）。</li>
        <li>點擊「轉換」以進行檔案類型的轉換。</li>
        <li>大功告成後，即可下載轉換好的檔案文件—就是這麼簡單！</li>
      </ol>
    </div>
  )
}

export default HowToSection

