'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/lib/server/blog';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogCarouselProps {
  posts: BlogPost[];
}

export default function BlogCarousel({ posts }: BlogCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 225, damping: 25 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 225, damping: 25 },
        opacity: { duration: 0.3 }
      }
    })
  };

  const paginate = (newDirection: number) => {
    if (posts.length <= 1) return; // Don't paginate if there's only one post or none
    
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let newIndex = prevIndex + newDirection;
      // Ensure we wrap around properly
      if (newIndex < 0) newIndex = posts.length - 1;
      if (newIndex >= posts.length) newIndex = 0;
      return newIndex;
    });
  };

  // Get the three visible posts, with proper wrapping
  const getVisiblePosts = () => {
    if (posts.length === 0) return [];
    if (posts.length === 1) return [posts[0]];
    
    const visiblePosts = [];
    for (let i = -1; i <= 1; i++) {
      let index = currentIndex + i;
      // Wrap around for negative indices
      if (index < 0) index = posts.length + index;
      // Wrap around for indices beyond array length
      index = index % posts.length;
      visiblePosts.push(posts[index]);
    }
    return visiblePosts;
  };

  if (posts.length === 0) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Latest Stories</h2>
            <Link href="/blog" className="text-orange-600 hover:text-orange-700">
              View All Posts
            </Link>
          </div>
          <p className="text-gray-600">No blog posts available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Latest Stories</h2>
          <Link href="/blog" className="text-orange-600 hover:text-orange-700">
            View All Posts
          </Link>
        </div>
        
        <div className="relative overflow-hidden">
          <AnimatePresence
            initial={false}
            custom={direction}
            mode="popLayout"
          >
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex gap-6"
              style={{
                width: '100%',
                position: 'relative'
              }}
            >
              {getVisiblePosts().map((post, i) => (
                <motion.div
                  key={`${post.slug}-${i}`}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)]"
                  layout
                  transition={{
                    layout: { type: "spring", stiffness: 225, damping: 25 }
                  }}
                >
                  <Link href={`/blog/${post.slug}`} className="block group">
                    <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg bg-gray-100">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {post.excerpt}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {posts.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all z-10"
              aria-label="Previous post"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all z-10"
              aria-label="Next post"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
} 