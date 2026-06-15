import Link from 'next/link';

export default function NewsCard({ noticia, campaign, action }) {
  if (!noticia) return null;

  const getYoutubeId = (url) => {
    if (!url) return null;
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
    <div className="bg-green-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <Link href={`/noticias/${noticia.id}`}>
        {/* Título y fecha en la misma línea */}
        <div className="flex justify-between items-start p-4 pb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{noticia.title}</h3>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(noticia.publishedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Miniatura del vídeo */}
        <div className="relative pb-56 bg-gray-200">
          <img src={thumbnail} alt={noticia.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="p-4 pt-2">
          <p className="text-gray-600 text-sm line-clamp-3">{noticia.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
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