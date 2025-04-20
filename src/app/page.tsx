import Image from 'next/image';
import Link from 'next/link';
import Map from './components/Map';
import BlogCarousel from './components/BlogCarousel';
import { mockLocations } from './data/mockLocations';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center bg-gray-900 overflow-hidden">
        {/* Skyline Background */}
        <div className="absolute right-0 bottom-0 w-full h-full">
          <Image
            src="/skyline.png"
            alt="Saigon Skyline"
            fill
            className="object-contain object-right-bottom"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />

        <div className="container mx-auto px-4 relative z-20">
          <div className="flex items-center justify-between">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Explore Saigon
          </h1>
              <p className="text-xl text-white/90 mb-8">
            Discover the best food spots, cafés, and sightseeing destinations in Ho Chi Minh City
          </p>
              <button className="bg-white text-orange-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-orange-50 transition-colors">
                Start Exploring
              </button>
            </div>
            <div className="relative w-[400px] h-[400px] hidden md:block">
              <div className="absolute inset-0 bg-orange-600/10 blur-3xl rounded-full"></div>
              <Image
                src="/logo.png"
                alt="Saigon CityBreak Logo"
                width={400}
                height={400}
                className="relative z-10 object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Interactive City Guide</h2>
            <p className="text-gray-600">
              Click on the markers to learn more about each location. Use the filters to explore different categories.
            </p>
          </div>
          <Map locations={mockLocations} />
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="bg-gray-50">
        <BlogCarousel posts={[
          {
            id: '1',
            title: 'Best Street Food in District 1',
            description: 'Discover the hidden gems and local favorites in Saigon\'s bustling District 1.',
            heroImage: '/blog/street-food.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Top 5 Coffee Shops with a View',
            description: 'Experience the best of Saigon\'s café culture with these stunning rooftop locations.',
            heroImage: '/blog/coffee-shops.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'A Day in Cho Lon',
            description: 'Explore the rich history and vibrant culture of Saigon\'s Chinatown.',
            heroImage: '/blog/cholon.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Hidden Rooftop Bars',
            description: 'Secret spots to enjoy the city skyline with craft cocktails and amazing atmosphere.',
            heroImage: '/blog/rooftop-bars.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            title: 'Markets of Saigon',
            description: 'From Ben Thanh to Binh Tay, explore the vibrant markets that give Saigon its unique character.',
            heroImage: '/blog/markets.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            title: 'Art and Culture Guide',
            description: 'Contemporary galleries, museums, and cultural spaces that showcase Vietnam\'s artistic spirit.',
            heroImage: '/blog/art-culture.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '7',
            title: 'District 2 Food Scene',
            description: 'Thao Dien\'s best restaurants, cafes, and international dining options.',
            heroImage: '/blog/district-2.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '8',
            title: 'Weekend Getaways',
            description: 'Quick escapes from the city to Can Gio, Cu Chi, and other nearby destinations.',
            heroImage: '/blog/getaways.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '9',
            title: 'Saigon by Night',
            description: 'Experience the city\'s vibrant nightlife from street food to live music venues.',
            heroImage: '/blog/nightlife.jpg',
            content: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]} />
      </section>

      {/* CTA Section */}
      <section className="bg-orange-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Saigon?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of travelers and get insider tips for your next adventure in Ho Chi Minh City.
          </p>
          <button className="bg-orange-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-orange-700 transition-colors">
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}
