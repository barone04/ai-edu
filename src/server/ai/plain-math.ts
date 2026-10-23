// The model sometimes answers in LaTeX ("\(\frac{1}{2}\)"); teachers and printed sheets need plain text.
const REPLACEMENTS: [RegExp, string][] = [
  [/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2"],
  [/\\(times|cdot)/g, "×"],
  [/\\div/g, ":"],
  [/\\left|\\right/g, ""],
  [/\\[()[\]]/g, ""],
  [/\$/g, ""],
];

export function plainMath(text: string): string {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) result = result.replace(pattern, replacement);
  return result.replace(/[ \t]{2,}/g, " ").trim();
}

// Applies plainMath to every string inside a parsed AI response.
export function plainMathDeep<T>(value: T): T {
  if (typeof value === "string") return plainMath(value) as T;
  if (Array.isArray(value)) return value.map(plainMathDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainMathDeep(v)])) as T;
  }
  return value;
}
