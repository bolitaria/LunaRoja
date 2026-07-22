const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'number', label: 'Número' },
];

export default function FieldEditor({ fields, onChange }) {
  const addField = () => {
    onChange([...fields, { name: '', label: '', type: 'text', required: false, unique: false }]);
  };

  const updateField = (index, key, value) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {fields.map((field, idx) => (
        <div key={idx} className="flex flex-wrap gap-2 items-center border p-2 rounded">
          <input
            placeholder="Nombre interno"
            value={field.name}
            onChange={e => updateField(idx, 'name', e.target.value)}
            className="border p-1 w-32"
            required
          />
          <input
            placeholder="Etiqueta visible"
            value={field.label}
            onChange={e => updateField(idx, 'label', e.target.value)}
            className="border p-1 w-40"
          />
          <select value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} className="border p-1">
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={e => updateField(idx, 'required', e.target.checked)}
            />
            <span>Requerido</span>
          </label>
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={field.unique || false}
              onChange={e => updateField(idx, 'unique', e.target.checked)}
            />
            <span>Único</span>
          </label>
          <button type="button" onClick={() => removeField(idx)} className="text-red-500">✕</button>
        </div>
      ))}
      <button type="button" onClick={addField} className="text-fuchsia-600 text-sm hover:underline">
        + Añadir campo
      </button>
    </div>
  );
}
