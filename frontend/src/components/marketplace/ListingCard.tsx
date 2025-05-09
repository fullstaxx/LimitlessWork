import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as anchor from '@coral-xyz/anchor';
import { Listing } from '../../services/ListingService';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const formatSol = (lamports: anchor.BN | number | string) =>
    (Number(lamports) / LAMPORTS_PER_SOL).toFixed(2);

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={() =>
        navigate(`/service/${listing.pda.toBase58()}_${listing.title}`)
      }
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {listing.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-3">
          {listing.description}
        </p>
        <div className="mt-4">
          <span className="text-xs inline-flex items-center font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5">
            {listing.category}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Starting at</p>
          <p className="text-xl font-bold text-gray-900">
            {formatSol(listing.standardPrice)} SOL
          </p>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span className="font-medium text-gray-900 mr-1">
            {listing.completedOrders.toString()}
          </span>
          orders completed
        </div>
      </div>
    </div>
  );
};
