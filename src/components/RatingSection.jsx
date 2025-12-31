import React from 'react'

function RatingSection() {
  return (
    <div className="rating-section">
      <h3 className="rating-title">為此工具評分</h3>
      <div className="rating-display">
        <span className="rating-score">4.5</span>
        <span className="rating-separator">/</span>
        <span className="rating-max">5</span>
        <span className="rating-count">- 257,416 個評分</span>
      </div>
    </div>
  )
}

export default RatingSection

