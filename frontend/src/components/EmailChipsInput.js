import { useState, useRef } from 'react';

export default function EmailChipsInput({ value = [], onChange, placeholder = "Añadir correo y pulsar Enter" }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addEmail = () => {
    const trimmed = input.trim();
    if (trimmed && trimmed.includes('@') && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeEmail = (email) => {
    onChange(value.filter(e => e !== email));
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border p-2 rounded min-h-[2.5rem] cursor-text" onClick={() => inputRef.current?.focus()}>
      {value.map(email => (
        <span key={email} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded-full">
          {email}
          <button type="button" className="ml-1 text-blue-500 hover:text-blue-700" onClick={() => removeEmail(email)}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-[120px] outline-none border-none text-sm"
        placeholder={value.length === 0 ? placeholder : ''}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addEmail}
      />
    </div>
  );
}
