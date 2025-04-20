import { mockLocations } from '../../data/mockLocations';
import Image from 'next/image';
import Link from 'next/link';

export default function LocationPage({ params }: { params: { id: string } }) {
  const location = mockLocations.find(loc => loc.id === params.id);

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Location not found</h1>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Link href="/" className="text-orange-600 hover:text-orange-700 mb-6 inline-block">
          ← Back to Map
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-64 w-full">
            <div className="absolute inset-0 bg-gray-200" />
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${
                location.category === 'food' ? 'bg-red-500' :
                location.category === 'cafe' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <span className="text-sm font-medium capitalize">{location.category}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{location.name}</h1>
            <p className="text-gray-600 mb-6">{location.description}</p>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Location</h2>
              <p className="text-gray-600">{location.address}</p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">Highlights</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {location.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 