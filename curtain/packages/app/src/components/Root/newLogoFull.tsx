import React from 'react';
import MyCustomLogo from './logo/my-logo.png';

export const LogoFull = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
      <img 
        src={MyCustomLogo} 
        alt="Logo" 
        style={{ 
          height: '100%', 
          width: 'auto', 
          display: 'block' 
        }} 
      />
    </div>
  );
};

