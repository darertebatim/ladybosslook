/** Presentation settings live alongside the preserved rich-text description. */
export type ProgramContentSource = 'description' | 'acquisition';
const marker = /<!--\s*rilo-program-content:(description|acquisition)\s*-->/gi;

export function readProgramContent(description: string | null | undefined, slug: string) {
  const value = description || '';
  const match = /<!--\s*rilo-program-content:(description|acquisition)\s*-->/i.exec(value);
  const source: ProgramContentSource = match?.[1] === 'description' ? 'description'
    : match?.[1] === 'acquisition' || slug.toLowerCase() === 'casigads' ? 'acquisition' : 'description';
  return { source, description: value.replace(marker, '').trim() };
}

export function writeProgramContent(description: string, source: ProgramContentSource) {
  return `<!-- rilo-program-content:${source} -->\n${description.replace(marker, '').trim()}`;
}
