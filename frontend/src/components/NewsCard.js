import Link from 'next/link';

export default function NewsCard({ noticia, campaign, action }) {
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(noticia.youtubeUrl);
  const thumbnail = noticia.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/placeholder.jpg');

  let newsTag = null;
  if (noticia.isNews) {
    if (action) newsTag = 'Noticia Acción';
    else if (campaign) newsTag = 'Noticia Campaña';
    else newsTag = 'Noticia';
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <Link href={`/noticias/${noticia.id}`}>
        <div className="relative pb-56 bg-gray-200">
          <img src={thumbnail} alt={noticia.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{noticia.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{noticia.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-xs text-gray-400">
              {new Date(noticia.publishedAt).toLocaleDateString()}
            </p>
            {newsTag && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {newsTag}
              </span>
            )}
            {campaign && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: `${campaign.color}20`, color: campaign.color }}
              >
                {campaign.name}
              </span>
            )}
            {action && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {action.title}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}