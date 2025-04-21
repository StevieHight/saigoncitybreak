import Image from 'next/image';
import Link from 'next/link';
import Map from './components/Map';
import BlogCarousel from './components/BlogCarousel';
import { getAllPosts } from '@/lib/server/blog';

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center bg-gray-900 overflow-hidden">
        {/* Skyline Background */}
        <div className="absolute inset-0">
          <Image
            src="/skyline.png"
            alt="Saigon Skyline"
            fill
            className="object-cover object-bottom"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
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
            <div className="relative w-[400px] h-[400px] hidden lg:block">
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
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Interactive City Guide</h2>
            <p className="text-gray-600 text-lg">
              Click on the markers to learn more about each location. Use the filters to explore different categories.
            </p>
          </div>
          <div className="h-[70vh] w-full rounded-xl overflow-hidden shadow-lg">
            <Map />
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <BlogCarousel posts={posts} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative">
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">Ready to Experience Saigon?</h2>
            <p className="text-xl text-white/90 mb-8">
              Join our community of travelers and get insider tips for your next adventure in Ho Chi Minh City.
            </p>
            <button className="bg-white text-orange-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-orange-50 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
