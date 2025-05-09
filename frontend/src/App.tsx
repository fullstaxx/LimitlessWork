// frontend/src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Use the *Provider* components, not the context objects themselves:
import { WalletContextProvider } from './contexts/WalletContext';
import { ProgramProvider } from './contexts/ProgramContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';

function App() {
  return (
    <Router>
      {/* ⚠️ Make sure these are the *Provider* components */}
      <WalletContextProvider>
        <ProgramProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/service/:id" element={<ServiceDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Make this path match exactly what you link to */}
              <Route path="/create" element={<CreateListingPage />} />

              {/* Fallback: redirect unknown paths back to marketplace */}
              <Route path="*" element={<MarketplacePage />} />
            </Routes>
          </MainLayout>
        </ProgramProvider>
      </WalletContextProvider>
    </Router>
  );
}

export default App;
