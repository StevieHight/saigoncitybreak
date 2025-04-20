import Image from 'next/image';
import Link from 'next/link';
import { BlogPost, BlogContent } from '@/lib/types/blog';

// This will be replaced with actual data fetching
async function getBlogPost(id: string): Promise<BlogPost> {
  // Placeholder implementation
  return {
    id,
    title: 'Sample Blog Post',
    description: 'This is a sample blog post description.',
    heroImage: '/placeholder.jpg',
    content: [
      { type: 'text', content: 'This is a sample paragraph.' },
      { type: 'image', url: '/placeholder.jpg', caption: 'Sample image' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);

  return (
    <article className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gray-900">
        <Image
          src={post.heroImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {post.title}
            </h1>
            <p className="text-xl text-white/90">
              {post.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {post.content.map((block, index) => {
            if (block.type === 'text') {
              return (
                <p key={index} className="text-lg text-gray-700 mb-6">
                  {block.content}
                </p>
              );
            } else if (block.type === 'image') {
              return (
                <figure key={index} className="my-8">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={block.url}
                      alt={block.caption || ''}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-2 text-center text-sm text-gray-500">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }
          })}
        </div>
      </div>

      {/* Back to Home */}
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-orange-600 hover:text-orange-700"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </article>
  );
} 