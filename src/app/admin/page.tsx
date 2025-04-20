'use client';

import { useState, useEffect } from 'react';
import { loadLocationsFromKML, KMLLocation } from '../utils/kmlParser';

interface SortConfig {
  key: keyof KMLLocation | '';
  direction: 'asc' | 'desc';
}

export default function AdminPage() {
  const [locations, setLocations] = useState<KMLLocation[]>([]);
  const [editingLocation, setEditingLocation] = useState<KMLLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<KMLLocation['category'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<KMLLocation>>({
    name: '',
    category: 'food',
    description: '',
    coordinates: { lat: 10.7769, lng: 106.7009 }
  });

  useEffect(() => {
    loadLocationsFromKML()
      .then(locations => {
        setLocations(locations);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading locations:', error);
        setLoading(false);
      });
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - you should use a more secure method in production
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleSave = async (updatedLocation: KMLLocation) => {
    try {
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
      setEditingLocation(null);
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
      const response = await fetch('/api/add-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) {
        throw new Error('Failed to add location');
      }

      const addedLocation = await response.json();
      setLocations([...locations, addedLocation]);
      setShowNewLocationForm(false);
      setNewLocation({
        name: '',
        category: 'food',
        description: '',
        coordinates: { lat: 10.7769, lng: 106.7009 }
      });
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
    .filter(location => 
      (filterCategory === 'all' || location.category === filterCategory) &&
      (searchTerm === '' || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase())))
    )
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
          <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 border rounded mb-4 text-gray-900"
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Location Manager</h1>
          <button
            onClick={() => setShowNewLocationForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add New Location
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border rounded text-gray-900"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as KMLLocation['category'] | 'all')}
              className="p-2 border rounded text-gray-900"
            >
              <option value="all" className="text-gray-900">All Categories</option>
              <option value="food" className="text-gray-900">Food</option>
              <option value="accommodation" className="text-gray-900">Accomm</option>
              <option value="interesting" className="text-gray-900">Interesting</option>
              <option value="cafe" className="text-gray-900">Cafes</option>
              <option value="bar" className="text-gray-900">Bars</option>
              <option value="shopping" className="text-gray-900">Shopping</option>
            </select>
            {selectedLocations.size > 0 && (
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value && confirm(`Are you sure you want to change the category of ${selectedLocations.size} locations to ${e.target.value}?`)) {
                      const selectedLocs = locations.filter(loc => 
                        selectedLocations.has(`${loc.coordinates.lat}-${loc.coordinates.lng}`)
                      );
                      
                      fetch('/api/bulk-update-locations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          locations: selectedLocs,
                          updates: {
                            category: e.target.value as KMLLocation['category']
                          }
                        }),
                      })
                      .then(response => response.json())
                      .then(data => {
                        if (data.success) {
                          // Update local state
                          setLocations(locations.map(loc => 
                            selectedLocations.has(`${loc.coordinates.lat}-${loc.coordinates.lng}`)
                              ? { ...loc, category: e.target.value as KMLLocation['category'] }
                              : loc
                          ));
                          setSelectedLocations(new Set());
                          alert(`Successfully updated ${data.updatedCount} locations`);
                        } else {
                          throw new Error(data.error || 'Failed to update locations');
                        }
                      })
                      .catch(error => {
                        console.error('Error updating locations:', error);
                        alert('Failed to update locations. Please try again.');
                      });
                    }
                    e.target.value = ''; // Reset select after use
                  }}
                  className="p-2 border rounded bg-blue-50 text-blue-600"
                  value=""
                >
                  <option value="">Change Category...</option>
                  <option value="food">Food</option>
                  <option value="accommodation">Accomm</option>
                  <option value="interesting">Interesting</option>
                  <option value="cafe">Cafes</option>
                  <option value="bar">Bars</option>
                  <option value="shopping">Shopping</option>
                </select>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete Selected ({selectedLocations.size})
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* New Location Form */}
        {showNewLocationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-xl font-bold mb-4">Add New Location</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <select
                  value={newLocation.category}
                  onChange={(e) => setNewLocation({...newLocation, category: e.target.value as KMLLocation['category']})}
                  className="w-full p-2 border rounded"
                >
                  <option value="food">Food</option>
                  <option value="accommodation">Accomm</option>
                  <option value="interesting">Interesting</option>
                  <option value="cafe">Cafes</option>
                  <option value="bar">Bars</option>
                  <option value="shopping">Shopping</option>
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Latitude"
                    value={newLocation.coordinates?.lat}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      coordinates: { 
                        lat: parseFloat(e.target.value),
                        lng: newLocation.coordinates?.lng ?? 106.7009
                      }
                    })}
                    className="w-1/2 p-2 border rounded"
                    step="any"
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    value={newLocation.coordinates?.lng}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      coordinates: { 
                        lat: newLocation.coordinates?.lat ?? 10.7769,
                        lng: parseFloat(e.target.value)
                      }
                    })}
                    className="w-1/2 p-2 border rounded"
                    step="any"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowNewLocationForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locations Table */}
        <div className="bg-white rounded-lg shadow max-w-full">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.size === locations.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLocations(new Set(locations.map(loc => 
                          `${loc.coordinates.lat}-${loc.coordinates.lng}`
                        )));
                      } else {
                        setSelectedLocations(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-[15%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="w-[12%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="w-[58%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="w-[15%] px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLocations.map((location) => (
                <tr key={`${location.coordinates.lat}-${location.coordinates.lng}`} className="hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedLocations.has(`${location.coordinates.lat}-${location.coordinates.lng}`)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedLocations);
                        if (e.target.checked) {
                          newSelected.add(`${location.coordinates.lat}-${location.coordinates.lng}`);
                        } else {
                          newSelected.delete(`${location.coordinates.lat}-${location.coordinates.lng}`);
                        }
                        setSelectedLocations(newSelected);
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-full overflow-hidden">
                      {editingLocation?.coordinates === location.coordinates ? (
                        <input
                          type="text"
                          value={editingLocation.name}
                          onChange={e => setEditingLocation({
                            ...editingLocation,
                            name: e.target.value
                          })}
                          className="w-full p-1 border rounded text-gray-900"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 truncate">{location.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-full overflow-hidden">
                      {editingLocation?.coordinates === location.coordinates ? (
                        <select
                          value={editingLocation.category}
                          onChange={e => setEditingLocation({
                            ...editingLocation,
                            category: e.target.value as KMLLocation['category']
                          })}
                          className="w-full p-1 border rounded text-gray-900"
                        >
                          <option value="food">Food</option>
                          <option value="accommodation">Accomm</option>
                          <option value="interesting">Interesting</option>
                          <option value="cafe">Cafes</option>
                          <option value="bar">Bars</option>
                          <option value="shopping">Shopping</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900 capitalize truncate">{location.category}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-full">
                      {editingLocation?.coordinates === location.coordinates ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingLocation.description}
                            onChange={e => setEditingLocation({
                              ...editingLocation,
                              description: e.target.value
                            })}
                            className="w-full p-1 border rounded text-gray-900"
                            placeholder="Description"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editingLocation.address || ''}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                address: e.target.value
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="Address"
                            />
                            <input
                              type="text"
                              value={editingLocation.phoneNumber || ''}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                phoneNumber: e.target.value
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="Phone"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editingLocation.rating || ''}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                rating: parseFloat(e.target.value)
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="Rating"
                              step="0.1"
                              min="0"
                              max="5"
                            />
                            <input
                              type="text"
                              value={editingLocation.descriptionUrl || ''}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                descriptionUrl: e.target.value
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="URL"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={editingLocation.coordinates.lat}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                coordinates: {
                                  ...editingLocation.coordinates,
                                  lat: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="Lat"
                              step="any"
                            />
                            <input
                              type="number"
                              value={editingLocation.coordinates.lng}
                              onChange={e => setEditingLocation({
                                ...editingLocation,
                                coordinates: {
                                  ...editingLocation.coordinates,
                                  lng: parseFloat(e.target.value)
                                }
                              })}
                              className="w-full p-1 border rounded text-gray-900"
                              placeholder="Lng"
                              step="any"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div className="text-gray-900 break-all line-clamp-2 hover:line-clamp-none">
                            {location.description || location.descriptionUrl}
                          </div>
                          <div className="flex flex-wrap gap-2 text-gray-600">
                            {location.address && (
                              <div className="inline-flex items-start break-all">
                                <span className="mr-1 flex-shrink-0">📍</span>
                                <span className="break-all">{location.address}</span>
                              </div>
                            )}
                            {location.phoneNumber && (
                              <div className="inline-flex items-center">
                                <span className="mr-1 flex-shrink-0">📞</span>
                                <span>{location.phoneNumber}</span>
                              </div>
                            )}
                            {location.rating && (
                              <div className="inline-flex items-center">
                                <span className="mr-1 flex-shrink-0">⭐</span>
                                <span>{location.rating}</span>
                              </div>
                            )}
                            <div className="inline-flex items-center text-gray-500">
                              <span className="mr-1 flex-shrink-0">📌</span>
                              <span>{location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="flex justify-end space-x-1">
                      {editingLocation?.coordinates === location.coordinates ? (
                        <>
                          <button
                            onClick={() => handleSave(editingLocation)}
                            className="bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 text-sm whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingLocation(null)}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 text-sm whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingLocation(location)}
                            className="bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 text-sm whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(location)}
                            className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 text-sm whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 