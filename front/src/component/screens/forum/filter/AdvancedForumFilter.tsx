import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface LocationFilters {
  regions: string[];
  cities: string[];
  districts: string[];
}

interface Props {
  onFilterChange: (filters: {
    region: string;
    city: string;
    district: string;
    address: string;
  }) => void;
  t: (key: string) => string;
}

export const AdvancedForumFilter: React.FC<Props> = ({ onFilterChange, t }) => {
  const [filters, setFilters] = useState<LocationFilters>({
    regions: [],
    cities: [],
    districts: [],
  });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [addressSearch, setAddressSearch] = useState('');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/forum/filters/');
        setFilters(response.data);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    onFilterChange({
      region: selectedRegion,
      city: selectedCity,
      district: selectedDistrict,
      address: addressSearch,
    });
  }, [selectedRegion, selectedCity, selectedDistrict, addressSearch, onFilterChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('forum.filter.region')}
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">{t('forum.filter.all')}</option>
          {filters.regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('forum.filter.city')}
        </label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">{t('forum.filter.all')}</option>
          {filters.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('forum.filter.district')}
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">{t('forum.filter.all')}</option>
          {filters.districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('forum.filter.address')}
        </label>
        <input
          type="text"
          value={addressSearch}
          onChange={(e) => setAddressSearch(e.target.value)}
          placeholder={t('forum.filter.addressPlaceholder')}
          className="w-full border rounded p-2"
        />
      </div>
    </div>
  );
}; 