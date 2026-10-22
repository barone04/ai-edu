import { expect, test } from "@playwright/test";

test("teacher creates a lesson for a new class", async ({ page }) => {
  await page.goto("/lessons/new");
  await expect(page.getByRole("button", { name: "Lưu tiết học" })).toBeVisible();
  const newClassToggle = page.getByRole("button", { name: "Lớp mới" });
  if (await newClassToggle.isVisible()) await newClassToggle.click();

  await page.locator('input[name="title"]').fill("Phép nhân số thập phân");
  await page.getByRole("button", { name: "Lưu tiết học" }).click();

  await expect(page.getByText("Hãy nhập tên lớp.")).toBeVisible();
  await expect(page.locator('input[name="title"]')).toHaveValue("Phép nhân số thập phân");

  await page.locator('input[name="className"]').fill("5B");
  await page.locator('select[name="grade"]').selectOption("5");
  await page.locator('input[name="studentCount"]').fill("32");
  await page.locator('textarea[name="learningObjective"]').fill("Nhân số thập phân với 10, 100.");
  await page.getByRole("button", { name: "Lưu tiết học" }).click();

  await expect(page.getByRole("heading", { name: "Phép nhân số thập phân" })).toBeVisible();
  await expect(page.getByText("Lớp 5B · 32 học sinh")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tiếp tục: Tạo bài" })).toBeVisible();
});

test("demo lesson is labelled as synthetic data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Xem bản mẫu" }).click();

  await expect(page.getByText("Dữ liệu minh họa")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tiếp tục: Xem lỗi sai" })).toBeVisible();
});
