import React from 'react'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4 className="footer-title">解決方案</h4>
            <ul className="footer-links">
              <li><a href="#">教育</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">公司</h4>
            <ul className="footer-links">
              <li><a href="#">關於</a></li>
              <li><a href="#">幫助</a></li>
              <li><a href="#">部落格</a></li>
              <li><a href="#">工作機會</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">產品</h4>
            <ul className="footer-links">
              <li><a href="#">嵌入 PDF</a></li>
              <li><a href="#">Developers</a></li>
              <li><a href="#">Sign.com</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">App</h4>
            <ul className="footer-links">
              <li><a href="#">下載 Convert Anything</a></li>
              <li><a href="#">PDF 掃描器</a></li>
              <li><a href="#">Windows App</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Convert Anything — made with 康皓雄(康康) 於 康普思生活通有限公司</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

