export interface BlogPost {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  content: BlogContent[];
  createdAt: string;
  updatedAt: string;
}

export type BlogContent = {
  type: 'text';
  content: string;
} | {
  type: 'image';
  url: string;
  caption?: string;
} 