import React from 'react';
import MyCustomLogo from './logos/SmallLogo.png';

export const LogoIcon = () => {
  return <img src={MyCustomLogo} alt="Logo" style={{ height: '40px', width: 'auto', display: 'block' }}/>;
};
