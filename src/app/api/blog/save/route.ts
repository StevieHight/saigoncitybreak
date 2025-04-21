import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function POST(request: Request) {
  try {
    const post = await request.json();

    // Validate required fields
    if (!post.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const postsDirectory = path.join(process.cwd(), 'src/content/blog');

    // Create the content directory if it doesn't exist
    try {
      await fs.promises.mkdir(postsDirectory, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      return NextResponse.json(
        { error: 'Failed to create blog directory' },
        { status: 500 }
      );
    }

    // Prepare the markdown content
    const frontmatter = {
      title: post.title,
      date: post.date || new Date().toISOString(),
      excerpt: post.excerpt || '',
      coverImage: post.coverImage || '',
      author: post.author || 'Anonymous',
      tags: Array.isArray(post.tags) ? post.tags : []
    };

    const markdown = matter.stringify(post.content || '', frontmatter);
    
    // Generate slug from title if not provided
    const slug = post.slug || post.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    const filePath = path.join(postsDirectory, `${slug}.md`);

    // Write the file
    try {
      await fs.promises.writeFile(filePath, markdown, 'utf8');
      return NextResponse.json({ success: true, slug });
    } catch (err) {
      console.error('Error writing file:', err);
      return NextResponse.json(
        { error: 'Failed to write blog post file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json(
      { error: 'Failed to save post' },
      { status: 500 }
    );
  }
} 