import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizes = {
    small: 20,
    medium: 40,
    large: 60
  };
  
  const pixelSize = sizes[size] || sizes.medium;
  
  return (
    <div className="spinner-container">
      <div 
        className="spinner"
        style={{
          width: pixelSize,
          height: pixelSize,
          borderWidth: pixelSize / 8
        }}
      />
      {text && <p className="spinner-text">{text}</p>}
      
      <style jsx>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .spinner {
          border: 3px solid #313244;
          border-top-color: #89b4fa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .spinner-text {
          color: #6c7086;
          font-size: 14px;
          margin: 0;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;