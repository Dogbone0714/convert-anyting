import React from 'react'
import Header from './components/Header'
import Breadcrumbs from './components/Breadcrumbs'
import UploadArea from './components/UploadArea'
import ServiceSection from './components/ServiceSection'
import FeaturesSection from './components/FeaturesSection'
import HowToSection from './components/HowToSection'
import FAQSection from './components/FAQSection'
import Footer from './components/Footer'

function App() {
  return (
    <div className="app">
      <Header />
      <Breadcrumbs />
      <main className="main-content">
        <div className="container">
          <h1 className="page-title">PDF轉換器</h1>
          <UploadArea />
          <ServiceSection />
          <FeaturesSection />
          <HowToSection />
          <FAQSection />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App

