import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Breadcrumbs from './components/Breadcrumbs'
import UploadArea from './components/UploadArea'
import ServiceSection from './components/ServiceSection'
import FeaturesSection from './components/FeaturesSection'
import HowToSection from './components/HowToSection'
import FAQSection from './components/FAQSection'
import CompressPage from './components/CompressPage'
import MergePage from './components/MergePage'
import Footer from './components/Footer'

// 創建一個簡單的上下文來管理頁面狀態
export const PageContext = React.createContext()

function App() {
  const [currentPage, setCurrentPage] = useState('convert') // 'convert', 'compress', 'merge'

  // 監聽導航點擊
  useEffect(() => {
    const handleNavClick = (e) => {
      const target = e.target.closest('a')
      if (target && target.classList.contains('nav-link')) {
        const text = target.textContent.trim()
        if (text === '壓縮') {
          e.preventDefault()
          setCurrentPage('compress')
        } else if (text === '轉換') {
          e.preventDefault()
          setCurrentPage('convert')
        } else if (text === '合併') {
          e.preventDefault()
          setCurrentPage('merge')
        }
      }
    }

    document.addEventListener('click', handleNavClick)
    return () => document.removeEventListener('click', handleNavClick)
  }, [])

  return (
    <PageContext.Provider value={{ currentPage, setCurrentPage }}>
      <div className="app">
        <Header />
        <Breadcrumbs currentPage={currentPage} />
        <main className="main-content">
          {currentPage === 'compress' ? (
            <CompressPage />
          ) : currentPage === 'merge' ? (
            <MergePage />
          ) : (
            <div className="container">
              <h1 className="page-title">PDF轉換器</h1>
              <UploadArea />
              <ServiceSection />
              <FeaturesSection />
              <HowToSection />
              <FAQSection />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </PageContext.Provider>
  )
}

export default App

