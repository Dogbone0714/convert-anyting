import React from 'react'
import ToolsDropdown from './ToolsDropdown'

function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.svg" alt="Convert Anything Logo" className="logo-image" />
            <span className="logo-text">Convert Anything</span>
          </div>
          <nav className="nav-menu">
            <ToolsDropdown />
            <a href="#" className="nav-link">壓縮</a>
            <a href="#" className="nav-link">轉換</a>
            <a href="#" className="nav-link">合併</a>
            <a href="#" className="nav-link">簽署</a>
            <a href="#" className="nav-link">AI PDF</a>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

