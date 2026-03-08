import { useState, useEffect } from 'react';
import axios from 'axios';

export default function InstagramFeed({ limit = 30 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (pageNum = 1) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/posts?limit=${limit}&page=${pageNum}`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando publicaciones de Instagram...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-center py-8">No hay publicaciones de Instagram.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map(post => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener"
            className="relative group overflow-hidden rounded-lg aspect-square bg-gray-100"
          >
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                poster={post.thumbnailUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.caption || 'Publicación de Instagram'}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
              <div className="text-white text-sm">
                {post.caption && <p className="line-clamp-2">{post.caption}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            </div>
            {post.account && (
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                @{post.account.username}
              </div>
            )}
          </a>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => fetchPosts(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => fetchPosts(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}