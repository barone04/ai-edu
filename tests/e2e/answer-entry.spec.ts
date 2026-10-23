import { expect, test } from "@playwright/test";
import { createLessonWithApprovedQuiz } from "./helpers";

test("teacher enters paper answers per pupil and they persist", async ({ page }) => {
  const lessonUrl = await createLessonWithApprovedQuiz(page, { pupils: 3 });
  await page.goto(`${lessonUrl}/answers`);

  await expect(page.getByText("H01", { exact: true }).first()).toBeVisible();
  await page.getByRole("group", { name: "Câu 1 của H01" }).getByRole("button", { name: "B" }).click();
  await page.getByRole("group", { name: "Câu 2 của H01" }).getByRole("button", { name: "A" }).click();
  await page.getByRole("group", { name: "Câu 3 của H01" }).getByRole("button", { name: "B" }).click();

  // completing a pupil moves on to the next code
  await expect(page.getByRole("group", { name: "Câu 1 của H02" })).toBeVisible();
  await page.getByRole("group", { name: "Câu 1 của H02" }).getByRole("button", { name: "C" }).click();
  await expect(page.getByText("1 em còn thiếu câu")).toBeVisible();
  await expect(page.getByText("Đã lưu")).toBeVisible();

  await page.reload();
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(page.getByRole("group", { name: "Câu 1 của H02" }).getByRole("button", { name: "C" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("teacher enters class totals and cannot exceed the class size", async ({ page }) => {
  const lessonUrl = await createLessonWithApprovedQuiz(page, { pupils: 30 });
  await page.goto(`${lessonUrl}/answers`);

  await page.getByRole("button", { name: "Nhanh cả lớp" }).click();
  await expect(page.getByText("không chia nhóm được từng học sinh")).toBeVisible();

  await page.getByLabel("Số học sinh chọn A ở câu 1").fill("20");
  await page.getByLabel("Số học sinh chọn B ở câu 1").fill("15");
  await expect(page.getByText("Tổng: 35/30 học sinh · vượt sĩ số")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu kết quả" })).toBeDisabled();

  await page.getByLabel("Số học sinh chọn B ở câu 1").fill("10");
  await page.getByRole("button", { name: "Lưu kết quả" }).click();
  await expect(page.getByText("Đã lưu kết quả.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Số học sinh chọn A ở câu 1")).toHaveValue("20");
});
