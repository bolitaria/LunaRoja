export default function GroupCard({ group }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
      <p className="text-gray-600 mb-4">{group.description}</p>
      <a
        href={group.telegramLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-500 text-white px-4 py-2 rounded inline-block hover:bg-blue-600"
      >
        Unirme en Telegram
      </a>
    </div>
  );
}