"use client";

interface RepoFilterProps {
  repos: Array<{ id: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function RepoFilter({ repos, value, onChange }: RepoFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-gray-800/50 border border-gray-700/50 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">모든 저장소</option>
      {repos.map((repo) => (
        <option key={repo.id} value={repo.id}>
          {repo.name}
        </option>
      ))}
    </select>
  );
}
