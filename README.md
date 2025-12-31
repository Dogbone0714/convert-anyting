# PDF 轉換器 - Convert Anything

這是一個使用 React 構建的功能完整的 PDF 轉換器網站，包含實際的 PDF 轉換功能。

## 功能特色

- 🎨 現代化的 React 用戶界面設計
- 📤 拖放文件上傳功能
- 📁 支援多種文件格式（PDF, Word, Excel, PowerPoint, 圖片等）
- 🔄 **實際的 PDF 轉換功能**（無需後端）
- 📊 轉換進度顯示
- 📥 自動下載轉換後的文件
- 📱 響應式設計，支援各種設備
- ✨ 流暢的動畫效果
- 🔒 文件驗證功能

## 支援的文件格式

### 轉換為 PDF
- ✅ Word (DOC, DOCX) - 使用 mammoth + html2canvas + jsPDF
- ✅ Excel (XLS, XLSX) - 使用 xlsx + html2canvas + jsPDF
- ✅ 圖片 (JPG, PNG, GIF, BMP, TIFF) - 使用 jsPDF

### 從 PDF 轉換
- ✅ PDF 轉 Word (DOCX) - 使用 pdf-lib
- ✅ PDF 轉 Excel (XLSX) - 使用 pdf-lib + xlsx
- ✅ PDF 轉 PowerPoint (PPTX) - 使用 pdf-lib + pptxgenjs
- ✅ PDF 轉圖片 (JPG/PNG) - 使用 Canvas API

## 技術棧

- **前端框架**: React 18
- **構建工具**: Vite
- **PDF 處理**: pdf-lib, pdfjs-dist
- **Word 處理**: mammoth
- **Excel 處理**: xlsx
- **PowerPoint 處理**: pptxgenjs
- **PDF 生成**: jsPDF
- **圖片處理**: html2canvas
- **文件下載**: file-saver

## 安裝與使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發服務器

```bash
npm run dev
```

應用將在 `http://localhost:3000` 啟動

### 3. 構建生產版本

```bash
npm run build
```

構建的文件將在 `dist/` 目錄中

### 4. 預覽生產版本

```bash
npm run preview
```

## 文件結構

```
convert-anything/
├── src/
│   ├── components/          # React 組件
│   │   ├── Header.jsx
│   │   ├── Breadcrumbs.jsx
│   │   ├── UploadArea.jsx   # 文件上傳和轉換組件
│   │   ├── ServiceSection.jsx
│   │   ├── FeaturesSection.jsx
│   │   ├── HowToSection.jsx
│   │   ├── FAQSection.jsx
│   │   ├── RatingSection.jsx
│   │   └── Footer.jsx
│   ├── utils/
│   │   └── pdfConverter.js  # PDF 轉換核心邏輯
│   ├── App.jsx              # 主應用組件
│   ├── main.jsx             # 應用入口
│   └── index.css            # 全局樣式
├── index.html               # HTML 模板
├── package.json             # 項目配置
├── vite.config.js          # Vite 配置
└── README.md               # 說明文件
```

## 使用方法

1. **上傳文件**
   - 點擊「選取檔案」按鈕
   - 或將文件拖放到紅色上傳區域

2. **選擇轉換格式**
   - 上傳後會自動顯示可用的轉換格式
   - 點擊想要的格式按鈕

3. **等待轉換**
   - 轉換過程中會顯示進度條
   - 轉換完成後文件會自動下載

## 轉換功能說明

### PDF 轉其他格式
- **PDF → Word**: 提取 PDF 頁面信息並生成 Word 文檔
- **PDF → Excel**: 將 PDF 內容轉換為 Excel 表格
- **PDF → PowerPoint**: 為每個 PDF 頁面創建幻燈片
- **PDF → 圖片**: 將 PDF 頁面渲染為圖片

### 其他格式轉 PDF
- **Word → PDF**: 將 Word 文檔轉換為 HTML，然後渲染為 PDF
- **Excel → PDF**: 將 Excel 表格轉換為 HTML，然後渲染為 PDF
- **圖片 → PDF**: 直接將圖片嵌入 PDF 文檔

## 瀏覽器支援

- ✅ Chrome (推薦)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

## 注意事項

⚠️ **轉換限制**

- PDF 轉 Word/Excel 的質量取決於原始 PDF 的結構
- 複雜的 PDF 格式可能無法完美轉換
- 大文件轉換可能需要較長時間
- 某些高級功能（如 OCR）需要額外的庫支持

## 未來改進

- [ ] 整合 pdf.js 實現更好的 PDF 文字提取
- [ ] 添加 OCR 功能（光學字元識別）
- [ ] 實現批量文件轉換
- [ ] 添加文件預覽功能
- [ ] 支援更多文件格式
- [ ] 添加轉換歷史記錄
- [ ] 實現雲端存儲功能
- [ ] 添加用戶帳戶系統

## 開發

### 添加新的轉換格式

1. 在 `src/utils/pdfConverter.js` 中添加新的轉換函數
2. 在 `src/components/UploadArea.jsx` 中更新可用格式列表
3. 更新文件類型檢測函數

### 自定義樣式

編輯 `src/index.css` 來修改應用樣式

## 授權

此專案僅供學習和示範用途。
