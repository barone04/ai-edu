import { expect, test } from "@playwright/test";

test("teacher writes, approves and prints a quiz without AI", async ({ page }) => {
  await page.goto("/lessons/new");
  await expect(page.getByRole("button", { name: "Lưu tiết học" })).toBeVisible();
  const newClassToggle = page.getByRole("button", { name: "Lớp mới" });
  if (await newClassToggle.isVisible()) await newClassToggle.click();
  await page.locator('input[name="className"]').fill("4C");
  await page.locator('input[name="studentCount"]').fill("25");
  await page.locator('input[name="title"]').fill("So sánh phân số");
  await page.locator('textarea[name="learningObjective"]').fill("So sánh hai phân số cùng mẫu.");
  await page.getByRole("button", { name: "Lưu tiết học" }).click();
  await page.getByRole("link", { name: "Tiếp tục: Tạo bài" }).click();

  await page.getByRole("button", { name: "Tự soạn câu hỏi" }).click();
  await page.getByRole("button", { name: "Duyệt bộ câu hỏi" }).click();
  await expect(page.getByText("Hãy sửa các mục được đánh dấu trước khi duyệt.")).toBeVisible();

  for (const n of [1, 2, 3]) {
    await page.getByLabel(`Nội dung câu ${n}`).fill(`Phân số nào lớn nhất? (câu ${n})`);
    for (const [key, value] of [["A", "1/5"], ["B", "2/5"], ["C", "3/5"], ["D", "4/5"]]) {
      await page.getByLabel(`Phương án ${key} câu ${n}`).fill(value);
    }
    await page.getByLabel(`Chọn D là đáp án đúng`).nth(n - 1).click();
    for (const key of ["A", "B", "C"]) {
      await page.getByLabel(`Lỗi hiểu sai khi chọn ${key} câu ${n}`).fill("Nghĩ tử số nhỏ thì lớn hơn");
    }
  }
  await page.getByRole("button", { name: "Duyệt bộ câu hỏi" }).click();
  await expect(page.getByText("Bộ câu hỏi đã được duyệt")).toBeVisible();

  await page.getByRole("link", { name: "In phiếu cho học sinh" }).click();
  const sheet = page.locator("article");
  await expect(sheet).toContainText("Phân số nào lớn nhất? (câu 3)");
  await expect(sheet).not.toContainText("Nghĩ tử số nhỏ thì lớn hơn");
  await expect(sheet).not.toContainText("✓");
});
