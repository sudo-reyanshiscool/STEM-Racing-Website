// Team members are written as "Name (Role)" in the content files.

export interface Member {
  name: string;
  role: string | undefined;
}

export function parseMember(text: string): Member {
  const trimmed = text.trim();
  const match = /^(.+?)\s*\(([^()]+)\)$/.exec(trimmed);
  if (!match || match[1] === undefined || match[2] === undefined) return { name: trimmed, role: undefined };
  return { name: match[1].trim(), role: match[2].trim() };
}
