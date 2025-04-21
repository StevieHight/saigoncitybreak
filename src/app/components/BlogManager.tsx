'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost } from '@/lib/server/blog';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />
});

interface BlogManagerProps {
  initialPosts: BlogPost[];
}

export default function BlogManager({ initialPosts }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = async (post: Partial<BlogPost>) => {
    try {
      if (!post.title) {
        alert('Title is required');
        return;
      }

      const response = await fetch('/api/blog/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          date: post.date || new Date().toISOString(),
          tags: post.tags || [],
          content: post.content || ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save post');
      }

      // Fetch updated posts
      const postsResponse = await fetch('/api/blog/posts');
      const updatedPosts = await postsResponse.json();
      setPosts(updatedPosts);

      // Close the edit/new form
      setEditingPost(null);
      setShowNewPostForm(false);
    } catch (error) {
      console.error('Error saving post:', error);
      alert(error instanceof Error ? error.message : 'Failed to save post. Please try again.');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch('/api/blog/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Update local state to remove the deleted post
      setPosts(posts.filter(post => post.slug !== slug));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleImageUpload = async (file: File, setImageUrl: (url: string) => void) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const ImageUploadField = ({ 
    value, 
    onChange 
  }: { 
    value: string, 
    onChange: (url: string) => void 
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cover Image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 p-2 border rounded text-black placeholder-gray-500"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-black rounded hover:bg-gray-200"
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file, onChange);
              }
            }}
          />
        </div>
        {value && (
          <div className="relative w-full h-48 bg-gray-100 rounded overflow-hidden">
            <Image
              src={value}
              alt="Cover image preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    );
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <button
          onClick={() => setShowNewPostForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New Post
        </button>
      </div>

      {/* Search */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <tr key={post.slug} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {post.coverImage && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-black">{post.title}</div>
                      <div className="text-sm text-gray-600">{post.excerpt}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-black">
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-black">{post.author}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-black">Edit Post</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Excerpt"
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <ImageUploadField
                value={editingPost?.coverImage || ''}
                onChange={(url) => setEditingPost(prev => ({ ...prev, coverImage: url }))}
              />
              <input
                type="text"
                placeholder="Author"
                value={editingPost.author}
                onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={editingPost.tags?.join(', ')}
                onChange={(e) => setEditingPost({
                  ...editingPost,
                  tags: e.target.value.split(',').map(tag => tag.trim())
                })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <ReactQuill
                value={editingPost.content}
                onChange={(content) => setEditingPost({ ...editingPost, content })}
                className="bg-white text-black"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 text-black hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingPost)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-black">New Post</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Excerpt"
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <ImageUploadField
                value={editingPost?.coverImage || ''}
                onChange={(url) => setEditingPost({ ...editingPost, coverImage: url })}
              />
              <input
                type="text"
                placeholder="Author"
                onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                onChange={(e) => setEditingPost({
                  ...editingPost,
                  tags: e.target.value.split(',').map(tag => tag.trim())
                })}
                className="w-full p-2 border rounded text-black placeholder-gray-500"
              />
              <ReactQuill
                onChange={(content) => setEditingPost({ ...editingPost, content })}
                className="bg-white text-black"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowNewPostForm(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 text-black hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingPost) {
                      handleSave({
                        ...editingPost,
                        date: new Date().toISOString(),
                        slug: editingPost.title?.toLowerCase().replace(/\s+/g, '-') || ''
                      });
                    }
                    setShowNewPostForm(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 