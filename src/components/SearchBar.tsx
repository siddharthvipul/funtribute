import { useState, useEffect } from 'react';

interface Props {
  query: string;
  onChange: (query: string) => void;
}

export function SearchBar({ query, onChange }: Props) {
  const [value, setValue] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => onChange(value), 200);
    return () => clearTimeout(timer);
  }, [value, onChange]);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search projects..."
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
        aria-label="Search projects"
      />
    </div>
  );
}
