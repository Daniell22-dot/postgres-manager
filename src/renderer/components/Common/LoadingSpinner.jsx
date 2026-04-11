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
      

    </div>
  );
};

export default LoadingSpinner;