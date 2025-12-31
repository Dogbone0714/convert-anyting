# 快速開始指南

## 安裝步驟

1. **安裝 Node.js**
   - 確保已安裝 Node.js (版本 16 或更高)
   - 檢查: `node --version`

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動開發服務器**
   ```bash
   npm run dev
   ```

4. **打開瀏覽器**
   - 訪問 `http://localhost:3000`
   - 開始使用 PDF 轉換功能！

## 使用說明

### 轉換 PDF 為其他格式
1. 上傳 PDF 文件
2. 選擇目標格式（Word、Excel、PowerPoint 或圖片）
3. 等待轉換完成
4. 文件會自動下載

### 轉換其他格式為 PDF
1. 上傳 Word、Excel 或圖片文件
2. 選擇「PDF」格式
3. 等待轉換完成
4. 文件會自動下載

## 故障排除

### 如果遇到依賴安裝問題
```bash
# 清除緩存並重新安裝
rm -rf node_modules package-lock.json
npm install
```

### 如果轉換失敗
- 確保文件格式正確
- 檢查文件大小（建議小於 50MB）
- 查看瀏覽器控制台的錯誤訊息

## 技術支援

如有問題，請檢查：
1. Node.js 版本是否正確
2. 所有依賴是否已正確安裝
3. 瀏覽器控制台是否有錯誤訊息

