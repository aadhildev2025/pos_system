import React from 'react';

const Header = ({ title, subtitle }) => {
  return (
    <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white p-4 sm:p-6 pl-16 sm:pl-6 rounded-lg shadow-soft mb-6 animate-slide-up">
      <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-primary-100 mt-1 sm:mt-2 text-sm sm:text-base">{subtitle}</p>}
    </div>
  );
};

export default Header;
