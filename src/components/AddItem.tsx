import { useState } from 'react';

interface Props {
  onAdd: (name: string) => void;
}

export function AddItem({ onAdd }: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className="add-item">
      <input
        type="text"
        placeholder="Add item..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <button onClick={submit}>Add</button>
    </div>
  );
}
