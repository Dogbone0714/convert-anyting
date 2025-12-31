import React from 'react'

function FAQSection() {
  const faqs = [
    {
      question: '請問我可以將哪些類型的檔案轉換為 PDF，或是從 PDF 轉換為哪些類型的檔案呢？',
      answer: '我們的工具有支援 Word（DOC、DOCX）、Excel（XLS、XLSX）、PowerPoint（PPT、PPTX）、JPG、PNG、TIFF 等多種檔案格式。不確定我們是否有對應您手邊檔案的檔案格式嗎？直接將檔案拖曳到本頁面頂端的工具框內即可確認。'
    },
    {
      question: '請問我該如何使用線上的 PDF 轉換工具呢？',
      answer: '直接將 Microsoft Word 文件、Excel、PPT 或圖片檔案等幾乎任何類型的檔案拖放到工具中、稍等片刻、挑選您想要的檔案輸出格式然後即可下載全新的輸出檔案。您也可以將 PDF 轉回這些格式。真的就是這麼輕鬆。'
    },
    {
      question: '請問我可以將掃描而來的 PDF 轉換為可供編輯的文件嗎？',
      answer: '目前我們的工具主要支援文字型 PDF 的轉換。掃描型 PDF 的 OCR（光學字元識別）功能正在開發中，敬請期待！'
    },
    {
      question: '請問我該如何在 Mac、Windows 或行動裝置上轉換 PDF 呢？',
      answer: 'Convert Anything 的轉換工具使用起來相當簡單上手。直接透過任何的裝置或瀏覽器來將檔案上傳至我們的線上 PDF 轉換工具中即可——無需另外安裝軟體。'
    },
    {
      question: '請問在使用 PDF 轉換工具時，我的資料是否有受到保障呢？',
      answer: '當然有囉！我們會使用 TLS 加密技術來保護傳輸的檔案，並在一小時後自動刪除所有檔案以提高整體的安全性。'
    },
    {
      question: '請問 Convert Anything 是免費的 PDF 轉換工具嗎？',
      answer: '當然是囉！Convert Anything 是完全免費的 PDF 轉換工具，無需註冊或登入即可使用。您可以自由轉換各種類型的檔案，沒有任何限制。'
    }
  ]

  return (
    <div className="faq-section">
      <h2 className="section-title">轉換 PDF 的常見問題集（FAQs）</h2>
      {faqs.map((faq, index) => (
        <div key={index} className="faq-item">
          <h3 className="faq-question">{faq.question}</h3>
          <p className="faq-answer">{faq.answer}</p>
        </div>
      ))}
    </div>
  )
}

export default FAQSection

