import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  content: string;
}

async function markdownToHtml(markdown: string) {
  // If the content is already HTML (starts with <), return it as is
  if (markdown.trim().startsWith('<')) {
    return markdown;
  }

  const result = await remark()
    .use(html)
    .process(markdown);
  return result.toString();
}

export async function getAllPosts(): Promise<BlogPost[]> {
  // Create directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
    return [];
  }

  // Get file names under /content/blog
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(async fileName => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, '');

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const { data, content } = matter(fileContents);
      
      // Convert markdown to HTML
      const contentHtml = await markdownToHtml(content);

      // Combine the data with the slug and HTML content
      return {
        slug,
        content: contentHtml,
        ...(data as Omit<BlogPost, 'slug' | 'content'>)
      };
    }));

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Convert markdown to HTML
    const contentHtml = await markdownToHtml(content);

    return {
      slug,
      content: contentHtml,
      ...(data as Omit<BlogPost, 'slug' | 'content'>)
    };
  } catch (e) {
    return null;
  }
} 