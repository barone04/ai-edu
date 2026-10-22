import { expect, test } from "@playwright/test";
import { createLessonWithApprovedQuiz } from "./helpers";

test("teacher reviews misconceptions and regroups a pupil", async ({ page }) => {
  const lessonUrl = await createLessonWithApprovedQuiz(page, { pupils: 3 });
  await page.goto(`${lessonUrl}/answers`);
  for (const [code, options] of Object.entries({
    H01: ["B", "B", "B"],
    H02: ["A", "A", "B"],
    H03: ["A", "A", "A"],
  })) {
    for (const [index, option] of options.entries()) {
      await page
        .getByRole("group", { name: `Câu ${index + 1} của ${code}` })
        .getByRole("button", { name: option, exact: true })
        .click();
    }
  }
  await expect(page.getByText("3/3", { exact: true })).toBeVisible();
  await expect(page.getByText("Đã lưu")).toBeVisible();

  await page.goto(`${lessonUrl}/diagnosis`);
  await expect(page.getByText("44%")).toBeVisible();
  const addsAcross = page.getByRole("checkbox", { name: /Cộng tử với tử, mẫu với mẫu/ });
  await expect(addsAcross).toHaveAttribute("aria-checked", "true");
  await expect(addsAcross).toContainText("5 lượt chọn");

  await expect(page.getByRole("button", { name: /H01, 3\/3/ })).toBeVisible();
  await page.getByRole("button", { name: /H02, 1\/3/ }).click();
  await page.getByRole("button", { name: "Xác nhận và soạn bài chữa lỗi" }).click();
  await expect(page).toHaveURL(/\/remedial$/);

  await page.goto(`${lessonUrl}/diagnosis`);
  await expect(page.getByRole("button", { name: /H02, 1\/3/ })).toHaveClass(/border-accent/);
});
