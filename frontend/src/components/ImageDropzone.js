export default function ImageDropzone({ imagePreview, onImageChange, onRemove }) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
        {imagePreview ? (
          <div className="relative w-full h-full">
            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs text-gray-500">Subir imagen</span>
          </>
        )}
        <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
      </label>
      <div className="text-sm text-gray-600">
        <p>Portada de la petición.</p>
        <p className="text-xs text-gray-400">JPG, PNG, WebP</p>
      </div>
    </div>
  );
}
