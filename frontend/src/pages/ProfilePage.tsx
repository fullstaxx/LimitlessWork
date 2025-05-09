// frontend/src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserService, UserProfile } from '../services/UserService';

const ProfilePage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { fetchUserProfile, registerUser, upgradeToPremium } = useUserService();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState<'client' | 'freelancer'>('client');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const p = await fetchUserProfile(publicKey);
        setProfile(p);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [connected, publicKey, fetchUserProfile]);

  // Handle form submit (register new profile)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Username is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    const success = await registerUser(username, userType);
    setSubmitting(false);

    if (success) {
      // reload profile
      setLoading(true);
      const p = await fetchUserProfile(publicKey!);
      setProfile(p);
      setLoading(false);
    } else {
      setError('Failed to create profile. Please try again.');
    }
  };

  // Handle upgrade to premium
  const handleUpgrade = async () => {
    setSubmitting(true);
    const success = await upgradeToPremium();
    setSubmitting(false);

    if (success) {
      // refresh profile
      setLoading(true);
      const p = await fetchUserProfile(publicKey!);
      setProfile(p);
      setLoading(false);
    } else {
      setError('Failed to upgrade. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="max-w-md mx-auto text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="mb-6">Please connect your Solana wallet to view or create your profile.</p>
      </div>
    );
  }

  // If profile exists, show summary
  if (profile) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <p className="mb-2"><span className="font-medium">Username:</span> {profile.username}</p>
        <p className="mb-2">
          <span className="font-medium">Type:</span>{' '}
          {'client' in profile.userType ? 'Client' : 'Freelancer'}
        </p>
        <p className="mb-4">
          <span className="font-medium">Premium:</span>{' '}
          {profile.isPremium ? 'Yes' : 'No'}
        </p>

        {!profile.isPremium && (
          <button
            onClick={handleUpgrade}
            disabled={submitting}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary disabled:opacity-75 mb-2"
          >
            {submitting ? 'Upgrading…' : 'Upgrade to Premium'}
          </button>
        )}
        <button
          onClick={() => navigate('/create')}
          className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          { 'freelancer' in profile.userType ? 'Create Listing' : 'Browse Marketplace' }
        </button>
      </div>
    );
  }

  // Otherwise, render Create Profile form
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Create Your Profile</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="client"
                checked={userType === 'client'}
                onChange={() => setUserType('client')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <span className="ml-2 text-gray-700">Client</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="freelancer"
                checked={userType === 'freelancer'}
                onChange={() => setUserType('freelancer')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <span className="ml-2 text-gray-700">Freelancer</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary disabled:opacity-75"
        >
          {submitting ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
