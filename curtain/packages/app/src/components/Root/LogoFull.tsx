import React from 'react';
import MyCustomLogo from './logos/extendedLogo.png';

export const LogoFull = () => {
  return <img src={MyCustomLogo} alt="Logo" style={{ height: '72px', width: 'auto', display: 'block' }}/>;
};
