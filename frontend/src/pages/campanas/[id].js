// ... (imports y lógica sin cambios hasta el mapeo de filteredActions)

{filteredActions.map(action => {
  const isPast = new Date(action.datetime) < now;
  const isOnline = action.locationType === 'online';
  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
  const catLabel = categoryLabels[action.category] || action.category;
  return (
    <Link key={action.id} href={`/acciones/${action.id}`} className="block">
      <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-700">{action.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-xs px-2 py-0.5 rounded-full border" style={catStyle}>
              {catLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            {isOnline ? '💻 Online' : '📍 Presencial'}
          </span>
          <span className="text-xs text-gray-400">{isPast ? 'Pasada' : 'Próxima'}</span>
        </div>
      </div>
    </Link>
  );
})}