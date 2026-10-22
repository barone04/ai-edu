import { expect, type Page } from "@playwright/test";

// Creates a lesson for a fresh class and approves a hand-written quiz; returns the lesson url.
export async function createLessonWithApprovedQuiz(
  page: Page,
  { pupils = 3, questions = 3 }: { pupils?: number; questions?: number } = {},
): Promise<string> {
  await page.goto("/lessons/new");
  await expect(page.getByRole("button", { name: "Lưu tiết học" })).toBeVisible();
  const newClassToggle = page.getByRole("button", { name: "Lớp mới" });
  if (await newClassToggle.isVisible()) await newClassToggle.click();
  await page.locator('input[name="className"]').fill("E2E");
  await page.locator('input[name="studentCount"]').fill(String(pupils));
  await page.locator('input[name="title"]').fill("Cộng phân số (E2E)");
  await page.locator('textarea[name="learningObjective"]').fill("Cộng hai phân số khác mẫu số.");
  await page.getByRole("button", { name: "Lưu tiết học" }).click();
  await page.getByRole("link", { name: "Tiếp tục: Tạo bài" }).click();
  const lessonUrl = page.url().replace(/\/quiz$/, "");

  await page.getByRole("button", { name: "Tự soạn câu hỏi" }).click();
  while ((await page.getByRole("heading", { name: /^Câu \d+$/ }).count()) < questions) {
    await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  }
  for (let n = 1; n <= questions; n++) {
    await page.getByLabel(`Nội dung câu ${n}`).fill(`1/2 + 1/4 = ? (câu ${n})`);
    for (const [key, value] of [["A", "2/6"], ["B", "3/4"], ["C", "2/4"], ["D", "1/6"]]) {
      await page.getByLabel(`Phương án ${key} câu ${n}`).fill(value);
    }
    await page.getByLabel("Chọn B là đáp án đúng").nth(n - 1).click();
    await page.getByLabel(`Lỗi hiểu sai khi chọn A câu ${n}`).fill("Cộng tử với tử, mẫu với mẫu");
    await page.getByLabel(`Lỗi hiểu sai khi chọn C câu ${n}`).fill("Quên đổi tử số");
    await page.getByLabel(`Lỗi hiểu sai khi chọn D câu ${n}`).fill("Cộng mẫu số");
  }
  await page.getByRole("button", { name: "Duyệt bộ câu hỏi" }).click();
  await expect(page.getByText("Bộ câu hỏi đã được duyệt")).toBeVisible();
  return lessonUrl;
}
