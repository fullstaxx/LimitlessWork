import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListingService } from '../../services/ListingService';

export const CreateListingForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [standardPrice, setStandardPrice] = useState('');
  const [deluxePrice, setDeluxePrice] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { createListing } = useListingService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Generate a unique listing ID
      const listingId = `listing-${Date.now()}`;

      // Convert string prices to numbers
      const standardPriceNum = parseFloat(standardPrice);
      const deluxePriceNum = deluxePrice ? parseFloat(deluxePrice) : undefined;
      const premiumPriceNum = premiumPrice ? parseFloat(premiumPrice) : undefined;

      const success = await createListing(
        listingId,
        title,
        description,
        category,
        standardPriceNum,
        deluxePriceNum,
        premiumPriceNum
      );

      if (success) {
        navigate('/my-services');
      } else {
        setError('Failed to create listing. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create a New Service</h2>
      
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Service Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
            maxLength={100}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            rows={4}
            required
            maxLength={500}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          >
            <option value="">Select a category</option>
            <option value="Design">Design</option>
            <option value="Development">Development</option>
            <option value="Marketing">Marketing</option>
            <option value="Writing">Writing</option>
            <option value="Video">Video & Animation</option>
            <option value="Music">Music & Audio</option>
            <option value="Business">Business</option>
            <option value="Lifestyle">Lifestyle</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="standardPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Standard Package Price (SOL)
          </label>
          <input
            type="number"
            id="standardPrice"
            value={standardPrice}
            onChange={(e) => setStandardPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="deluxePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Deluxe Package Price (SOL) - Optional
          </label>
          <input
            type="number"
            id="deluxePrice"
            value={deluxePrice}
            onChange={(e) => setDeluxePrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="premiumPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Premium Package Price (SOL) - Optional
          </label>
          <input
            type="number"
            id="premiumPrice"
            value={premiumPrice}
            onChange={(e) => setPremiumPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/my-services')}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};