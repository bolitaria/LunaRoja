import Link from 'next/link';
import ReactPlayer from 'react-player';

export default function VideoCard({ video }) {
  // Extraer ID de YouTube de la URL
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(video.youtubeUrl);
  const thumbnail = video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/placeholder.jpg');

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={`/videos/${video.id}`}>
        <div className="relative pb-56 bg-gray-200">
          <img src={thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{video.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(video.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </Link>
    </div>
  );
}