'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/lib/types/blog';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogCarouselProps {
  posts: BlogPost[];
}

export default function BlogCarousel({ posts }: BlogCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '-33.333%' : '33.333%',
      opacity: 1
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '-33.333%' : '33.333%',
      opacity: 1
    })
  };

  const paginate = (newDirection: number) => {
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

  return (
    <div className="relative w-full overflow-hidden py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Latest Stories</h2>
        
        <div className="relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
              className="flex gap-6"
            >
              {getVisiblePosts().map((post, i) => (
                <div
                  key={`${post.id}-${i}`}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)]"
                >
                  <Link href={`/blog/${post.id}`} className="block group">
                    <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg">
                      <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {post.description}
                    </p>
                  </Link>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
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
      </div>
    </div>
  );
} 