export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9\s/-]/g, '')
    .replace(/\s+/g, ' ');
}

export function expectedAnswerVariants(answer: string): string[] {
  return answer
    .split('/')
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

export function isAnswerCorrect(expected: string, actual: string): boolean {
  const normalizedActual = normalizeText(actual);
  if (!normalizedActual) return false;
  return expectedAnswerVariants(expected).includes(normalizedActual);
}

