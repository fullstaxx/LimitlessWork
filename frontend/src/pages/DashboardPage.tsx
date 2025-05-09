import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { useUserService } from '../services/UserService';

const DashboardPage: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const { fetchUserProfile } = useUserService();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect to home if not connected
    if (!connected || !publicKey) {
      navigate('/');
      return;
    }
    
    const loadUserData = async () => {
      try {
        // Load user profile
        const profile = await fetchUserProfile(publicKey);
        
        if (!profile) {
          // Redirect to profile creation if no profile exists
          navigate('/profile');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [connected, publicKey, navigate, fetchUserProfile]);
  
  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p>Please connect your wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Active Orders</h2>
        <p className="text-gray-500">You don't have any active orders yet.</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Transaction History</h2>
        <p className="text-gray-500">No transactions to display.</p>
      </div>
    </div>
  );
};

export default DashboardPage;