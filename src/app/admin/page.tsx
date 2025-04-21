'use client';

import { useState, useEffect } from 'react';
import { loadLocationsFromKML, KMLLocation } from '@/app/utils/kmlParser';
import BlogManager from '@/app/components/BlogManager';
import type { BlogPost } from '@/lib/server/blog';

interface SortConfig {
  key: keyof KMLLocation | '';
  direction: 'asc' | 'desc';
}

export default function AdminPage() {
  const [locations, setLocations] = useState<KMLLocation[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<KMLLocation['category'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [newLocation, setNewLocation] = useState<KMLLocation>({
    name: '',
    category: 'food',
    description: '',
    address: '',
    phoneNumber: '',
    descriptionUrl: '',
    blogSlug: undefined,
    coordinates: { lat: 10.7769, lng: 106.7009 }
  });
  const [activeTab, setActiveTab] = useState<'locations' | 'blog'>('locations');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsData, postsResponse] = await Promise.all([
          loadLocationsFromKML(),
          fetch('/api/blog/posts')
        ]);
        
        const postsData = await postsResponse.json();
        
        setLocations(locationsData);
        setBlogPosts(postsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleSave = async (updatedLocation: KMLLocation) => {
    try {
      console.log('Saving location with blog slug:', updatedLocation.blogSlug);
      const response = await fetch('/api/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLocation),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      setLocations(locations.map(loc => 
        loc.coordinates.lat === updatedLocation.coordinates.lat && 
        loc.coordinates.lng === updatedLocation.coordinates.lng 
          ? updatedLocation 
          : loc
      ));
      console.log('Location saved successfully with blog slug:', updatedLocation.blogSlug);
      
      // Close the modal after successful save
      setShowNewLocationForm(false);
      // Reset the form
      setNewLocation({
        name: '',
        category: 'food',
        description: '',
        address: '',
        phoneNumber: '',
        descriptionUrl: '',
        blogSlug: undefined,
        coordinates: { lat: 10.7769, lng: 106.7009 }
      });
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDelete = async (location: KMLLocation) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch('/api/delete-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      setLocations(locations.filter(loc => 
        loc.coordinates.lat !== location.coordinates.lat || 
        loc.coordinates.lng !== location.coordinates.lng
      ));
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedLocations.size} locations?`)) return;

    try {
      const locationsToDelete = locations.filter(loc => 
        selectedLocations.has(`${loc.coordinates.lat}-${loc.coordinates.lng}`)
      );

      const response = await fetch('/api/bulk-delete-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationsToDelete),
      });

      if (!response.ok) {
        throw new Error('Failed to delete locations');
      }

      setLocations(locations.filter(loc => 
        !selectedLocations.has(`${loc.coordinates.lat}-${loc.coordinates.lng}`)
      ));
      setSelectedLocations(new Set());
    } catch (error) {
      console.error('Error deleting locations:', error);
      alert('Failed to delete locations. Please try again.');
    }
  };

  const handleAddLocation = async () => {
    try {
      console.log('Adding location with blog slug:', newLocation.blogSlug);
      const response = await fetch('/api/add-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add location');
      }

      const { success } = await response.json();
      if (success) {
        setLocations([...locations, { ...newLocation }]);
        console.log('Location added successfully with blog slug:', newLocation.blogSlug);
        setShowNewLocationForm(false);
        setNewLocation({
          name: '',
          category: 'food',
          description: '',
          address: '',
          phoneNumber: '',
          descriptionUrl: '',
          blogSlug: undefined,
          coordinates: { lat: 10.7769, lng: 106.7009 }
        });
      } else {
        throw new Error('Server returned success: false');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Failed to add location. Please try again.');
    }
  };

  const handleSort = (key: keyof KMLLocation) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };

  const filteredAndSortedLocations = locations
    .filter(location => {
      if (!location || !location.name) return false;
      
      const matchesCategory = filterCategory === 'all' || location.category === filterCategory;
      
      if (!searchTerm) return matchesCategory;
      
      const searchTermLower = searchTerm.toLowerCase();
      const nameMatch = location.name.toLowerCase().includes(searchTermLower);
      const descriptionMatch = location.description ? 
        location.description.toLowerCase().includes(searchTermLower) : 
        false;
      
      return matchesCategory && (nameMatch || descriptionMatch);
    })
    .sort((a, b) => {
      if (sortConfig.key === '') return 0;
      
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'undefined' || typeof bVal === 'undefined') return 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-black">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 border rounded mb-4 text-black placeholder-gray-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('locations')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'locations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'blog'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Blog Posts
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'locations' ? (
          <LocationManager
            locations={filteredAndSortedLocations}
            onSave={handleSave}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortConfig={sortConfig}
            onSort={handleSort}
            showNewLocationForm={showNewLocationForm}
            setShowNewLocationForm={setShowNewLocationForm}
            newLocation={newLocation}
            setNewLocation={setNewLocation}
            onAddLocation={handleAddLocation}
            blogPosts={blogPosts}
          />
        ) : (
          <BlogManager initialPosts={blogPosts} />
        )}
      </div>
    </div>
  );
}

function LocationManager({
  locations,
  onSave,
  onDelete,
  onBulkDelete,
  selectedLocations,
  setSelectedLocations,
  filterCategory,
  setFilterCategory,
  searchTerm,
  setSearchTerm,
  sortConfig,
  onSort,
  showNewLocationForm,
  setShowNewLocationForm,
  newLocation,
  setNewLocation,
  onAddLocation,
  blogPosts
}: {
  locations: KMLLocation[];
  onSave: (updatedLocation: KMLLocation) => void;
  onDelete: (location: KMLLocation) => void;
  onBulkDelete: () => void;
  selectedLocations: Set<string>;
  setSelectedLocations: React.Dispatch<React.SetStateAction<Set<string>>>;
  filterCategory: KMLLocation['category'] | 'all';
  setFilterCategory: React.Dispatch<React.SetStateAction<KMLLocation['category'] | 'all'>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  sortConfig: SortConfig;
  onSort: (key: keyof KMLLocation) => void;
  showNewLocationForm: boolean;
  setShowNewLocationForm: React.Dispatch<React.SetStateAction<boolean>>;
  newLocation: KMLLocation;
  setNewLocation: React.Dispatch<React.SetStateAction<KMLLocation>>;
  onAddLocation: () => void;
  blogPosts: BlogPost[];
}) {
  return (
    <div>
      {/* Location Manager UI */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as KMLLocation['category'] | 'all')}
            className="p-2 border rounded text-black"
          >
            <option value="all">All Categories</option>
            <option value="food">Food</option>
            <option value="cafe">Cafe</option>
            <option value="attraction">Attraction</option>
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search locations..."
            className="p-2 border rounded text-black w-64"
          />
          {selectedLocations.size > 0 && (
            <button
              onClick={onBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete Selected ({selectedLocations.size})
            </button>
          )}
        </div>
        <button
          onClick={() => setShowNewLocationForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedLocations.size === locations.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocations(new Set(locations.map(loc => `${loc.coordinates.lat}-${loc.coordinates.lng}`)));
                    } else {
                      setSelectedLocations(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600"
                />
              </th>
              <th className="w-1/4 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={`${location.coordinates.lat}-${location.coordinates.lng}`} className="hover:bg-gray-50">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.has(`${location.coordinates.lat}-${location.coordinates.lng}`)}
                    onChange={(e) => {
                      const key = `${location.coordinates.lat}-${location.coordinates.lng}`;
                      const newSelected = new Set(selectedLocations);
                      if (e.target.checked) {
                        newSelected.add(key);
                      } else {
                        newSelected.delete(key);
                      }
                      setSelectedLocations(newSelected);
                    }}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="truncate font-medium text-gray-900">
                    {location.name}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="truncate text-sm text-gray-500">
                    {location.category}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 break-words">{location.description}</p>
                    {location.address && (
                      <p className="text-sm text-gray-500 break-words">
                        <span className="font-medium">Address:</span> {location.address}
                      </p>
                    )}
                    {location.phoneNumber && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Phone:</span> {location.phoneNumber}
                      </p>
                    )}
                    {location.rating && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Rating:</span> {location.rating}
                      </p>
                    )}
                    {location.blogSlug && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Blog:</span> {location.blogSlug}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Coordinates:</span> {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                    </p>
                    {location.descriptionUrl && (
                      <a
                        href={location.descriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 inline-block"
                      >
                        More Info →
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setNewLocation({
                          ...location,
                          blogSlug: location.blogSlug || undefined
                        });
                        setShowNewLocationForm(true);
                      }}
                      className="bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(location)}
                      className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Location Form */}
      {showNewLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {newLocation.name ? 'Edit Location' : 'Add New Location'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={newLocation.category}
                  onChange={(e) => setNewLocation({ ...newLocation, category: e.target.value as KMLLocation['category'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="food">Food</option>
                  <option value="cafe">Cafe</option>
                  <option value="attraction">Attraction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={newLocation.address || ''}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  value={newLocation.phoneNumber || ''}
                  onChange={(e) => setNewLocation({ ...newLocation, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={newLocation.rating || ''}
                  onChange={(e) => setNewLocation({ ...newLocation, rating: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description URL</label>
                <input
                  type="url"
                  value={newLocation.descriptionUrl || ''}
                  onChange={(e) => setNewLocation({ ...newLocation, descriptionUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link to Blog Post</label>
                <select
                  value={newLocation.blogSlug || ''}
                  onChange={(e) => setNewLocation({ ...newLocation, blogSlug: e.target.value || undefined })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">No linked blog post</option>
                  {[...blogPosts]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((post) => (
                      <option key={post.slug} value={post.slug}>
                        {post.title}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.coordinates.lat}
                  onChange={(e) => setNewLocation({
                    ...newLocation,
                    coordinates: { ...newLocation.coordinates, lat: parseFloat(e.target.value) }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.coordinates.lng}
                  onChange={(e) => setNewLocation({
                    ...newLocation,
                    coordinates: { ...newLocation.coordinates, lng: parseFloat(e.target.value) }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewLocationForm(false);
                  setNewLocation({
                    name: '',
                    category: 'food',
                    description: '',
                    address: '',
                    phoneNumber: '',
                    descriptionUrl: '',
                    blogSlug: undefined,
                    coordinates: { lat: 10.7769, lng: 106.7009 }
                  });
                }}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newLocation.name) {
                    // If we have coordinates, this is an edit
                    if (locations.some(loc => 
                      loc.coordinates.lat === newLocation.coordinates.lat && 
                      loc.coordinates.lng === newLocation.coordinates.lng
                    )) {
                      onSave(newLocation);
                    } else {
                      onAddLocation();
                    }
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {locations.some(loc => 
                  loc.coordinates.lat === newLocation.coordinates.lat && 
                  loc.coordinates.lng === newLocation.coordinates.lng
                ) ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 