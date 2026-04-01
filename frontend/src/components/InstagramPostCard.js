import Link from 'next/link';

export default function InstagramPostCard({ post }) {
  const formattedDate = new Date(post.timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shortCaption = post.caption?.length > 120
    ? `${post.caption.substring(0, 120)}...`
    : post.caption;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <a href={post.permalink} target="_blank" rel="noopener noreferrer">
        <div className="relative pb-56 bg-gray-200">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              poster={post.thumbnailUrl}
              className="absolute inset-0 w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={post.thumbnailUrl || post.mediaUrl}
              alt={post.caption || 'Instagram post'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500">@{post.account?.username}</span>
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
          {shortCaption && (
            <p className="text-gray-700 text-sm line-clamp-3">{shortCaption}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {post.likes > 0 && <span>❤️ {post.likes}</span>}
            {post.comments > 0 && <span>💬 {post.comments}</span>}
            <span>🔗 Ver en Instagram</span>
          </div>
        </div>
      </a>
    </div>
  );
}