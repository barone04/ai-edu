// Anonymous pupil codes H01, H02, ... used instead of names.
export function studentCodes(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `H${String(i + 1).padStart(2, "0")}`);
}
