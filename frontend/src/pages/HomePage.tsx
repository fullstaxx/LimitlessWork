import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';

const HomePage: React.FC = () => {
  const { connected } = useWallet();
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Premier Freelance Platform on Solana
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              LimitlessWork brings true utility to the blockchain, ensuring business is conducted in a secure, transparent, and decentralized environment.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {connected ? (
                <button
                  onClick={() => navigate('/marketplace')}
                  className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Explore Services
                </button>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-lg text-gray-700">Connect your wallet to get started</p>
                </div>
              )}
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Better Freelancing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              LimitlessWork uses blockchain technology to create a secure, transparent, and efficient freelance marketplace.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    {/* Icon placeholder */}
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Secure Escrow System
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our blockchain-based escrow ensures that payments are only released when work is completed and approved.
                </dd>
              </div>
              {/* Add more feature blocks here */}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;