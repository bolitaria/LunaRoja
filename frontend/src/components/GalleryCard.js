import Link from 'next/link';

export default function GalleryCard({ item }) {
  if (!item) return null;
  return (
    <Link href={`/galeria/${item.id}`}>
      <div className="relative pb-[100%] bg-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
        <img
          src={item.thumbnail || item.imageUrl || '/placeholder.jpg'}
          alt={item.title || 'Imagen de galería'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </Link>
  );
}