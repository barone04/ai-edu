import { describe, expect, it } from "vitest";
import { plainMath, plainMathDeep } from "@/server/ai/plain-math";

describe("plainMath", () => {
  it("turns LaTeX fractions into plain a/b", () => {
    expect(plainMath("Tính: \\(\\frac{1}{2}+\\frac{1}{3}\\)")).toBe("Tính: 1/2+1/3");
    expect(plainMath("$\\dfrac{3}{4}$ \\times 2")).toBe("3/4 × 2");
  });

  it("leaves plain text untouched", () => {
    expect(plainMath("Tính: 1/2 + 1/4 = ?")).toBe("Tính: 1/2 + 1/4 = ?");
  });

  it("cleans every string in a nested response", () => {
    expect(plainMathDeep({ q: ["\\(\\frac{5}{6}\\)"], n: 3 })).toEqual({ q: ["5/6"], n: 3 });
  });
});
