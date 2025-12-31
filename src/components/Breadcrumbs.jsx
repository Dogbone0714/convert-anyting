import React from 'react'

function Breadcrumbs({ currentPage = 'convert' }) {
  const pageName = 
    currentPage === 'compress' ? '壓縮 PDF' :
    currentPage === 'merge' ? '合併PDF' :
    'PDF轉換器'
  
  return (
    <div className="breadcrumbs">
      <div className="container">
        <a href="#" className="breadcrumb-link">首頁</a>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{pageName}</span>
      </div>
    </div>
  )
}

export default Breadcrumbs

