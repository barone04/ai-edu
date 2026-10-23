import { expect, test } from "@playwright/test";
import { answerAndConfirmDiagnosis, createLessonWithApprovedQuiz } from "./helpers";

test("teacher writes remedial worksheets by hand and prints pupil sheets without answers", async ({
  page,
}) => {
  const lessonUrl = await createLessonWithApprovedQuiz(page, { pupils: 3 });
  await answerAndConfirmDiagnosis(page, lessonUrl);

  await expect(page.getByText("Lỗi cần chữa")).toBeVisible();
  await page.getByRole("button", { name: "Tự soạn" }).click();
  await page.getByLabel("Giải thích cho học sinh").fill("Phải chia bánh thành các phần bằng nhau.");
  for (const group of ["Nhóm A", "Nhóm B", "Nhóm C"]) {
    await page.getByLabel(`${group} bài 1`, { exact: true }).fill(`Tính 1/2 + 1/4 (${group})`);
    await page.getByLabel(`Đáp án ${group} bài 1`).fill("3/4 đáp-án-bí-mật");
  }
  await page.getByRole("button", { name: "Lưu bài chữa lỗi" }).click();

  await expect(page.getByText("Phải chia bánh thành các phần bằng nhau.")).toBeVisible();
  await expect(page.getByText("H02, H03")).toBeVisible();

  await expect(page.getByRole("link", { name: "Phiếu HS" })).toBeVisible();
  // load the print view fresh: client navigation keeps the previous page mounted but hidden
  await page.goto(`${lessonUrl}/remedial/print?view=pupil`);
  await expect(page.getByText("Phiếu luyện tập Nhóm C")).toBeVisible();
  await expect(page.getByText("Tính 1/2 + 1/4 (Nhóm B)")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("đáp-án-bí-mật");

  await page.goto(`${lessonUrl}/remedial/print?view=teacher`);
  await expect(page.getByText("Đáp án: 3/4 đáp-án-bí-mật").first()).toBeVisible();
});
