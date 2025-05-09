// src/components/layout/MainLayout.tsx

import React, { FC, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface Props {
  children: ReactNode;
}

export const MainLayout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-primary">LimitlessWork</span>
              <nav className="flex space-x-4">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/marketplace', label: 'Marketplace' },
                  { to: '/create', label: 'Create Listing' },
                  { to: '/my-services', label: 'My Services' },
                  { to: '/dashboard', label: 'Dashboard' },
                ].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Wallet button */}
            <div className="flex items-center">
              <WalletMultiButton className="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} LimitlessWork — All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};
