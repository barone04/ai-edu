import { z } from "zod";
import { DIFFICULTIES, type QuestionDraft } from "@/server/questions";
import { OPTION_KEYS } from "@/server/stats";
import { generateJson } from "./groq";

export const DIAGNOSTIC_QUIZ_PROMPT_VERSION = "diagnostic-quiz@1";

// No length constraints here: Groq strict mode supports only a subset of JSON schema.
const aiQuizSchema = z.object({
  questions: z.array(
    z.object({
      content: z.string(),
      options: z.object({ A: z.string(), B: z.string(), C: z.string(), D: z.string() }),
      correctOption: z.enum(OPTION_KEYS),
      distractors: z.array(z.object({ option: z.enum(OPTION_KEYS), misconception: z.string() })),
      explanation: z.string(),
      difficulty: z.enum(DIFFICULTIES),
    }),
  ),
});

export type QuizRequest = {
  grade: number;
  subject: string;
  title: string;
  learningObjective: string;
  referenceText: string | null;
  questionCount: number;
  // when set, generate an equivalent follow-up quiz that avoids repeating these questions
  previousQuestions?: string[];
};

const SYSTEM_PROMPT = `Bạn là giáo viên tiểu học Việt Nam giàu kinh nghiệm, chuyên thiết kế câu hỏi chẩn đoán lỗi hiểu sai.

Yêu cầu bắt buộc:
- Viết bằng tiếng Việt, câu ngắn, từ ngữ phù hợp lứa tuổi học sinh.
- Mỗi câu có đúng 4 phương án A, B, C, D và đúng 1 phương án đúng. Tự kiểm tra lại phép tính của phương án đúng.
- Mỗi phương án sai phải là kết quả học sinh thật sự nhận được khi mắc một lỗi hiểu sai cụ thể và phổ biến. Hãy áp dụng lỗi đó vào đề bài để tính ra phương án sai, không bịa số ngẫu nhiên.
- Ưu tiên các lỗi hiểu sai phổ biến nhất của chủ đề. Ví dụ với cộng phân số khác mẫu: cộng tử với tử, mẫu với mẫu; quy đồng mẫu số nhưng quên đổi tử số.
- "distractors" liệt kê đúng 3 phương án sai, mỗi mục mô tả lỗi hiểu sai trong tối đa 20 chữ, viết cho giáo viên đọc.
- Các phương án không trùng nhau. Thay đổi vị trí đáp án đúng giữa các câu.
- "explanation" giải thích ngắn gọn cách làm đúng.
- Không trích dẫn hay bịa nội dung sách giáo khoa. Chỉ dựa vào mục tiêu và nội dung giáo viên cung cấp.`;

function buildUserPrompt(request: QuizRequest): string {
  const lines = [
    `Khối lớp: ${request.grade}`,
    `Môn: ${request.subject}`,
    `Bài học: ${request.title}`,
    `Mục tiêu: ${request.learningObjective}`,
  ];
  if (request.referenceText) lines.push(`Nội dung giáo viên cung cấp:\n${request.referenceText}`);
  if (request.previousQuestions?.length) {
    lines.push(
      "Đây là bài kiểm tra lại sau khi dạy bổ sung. Tạo câu hỏi tương đương về cùng mục tiêu và độ khó, nhưng dùng số liệu và tình huống khác, không lặp lại các câu sau:",
      ...request.previousQuestions.map((question, index) => `${index + 1}. ${question}`),
    );
  }
  lines.push(`Hãy tạo đúng ${request.questionCount} câu hỏi trắc nghiệm.`);
  return lines.join("\n");
}

export async function generateDiagnosticQuiz(request: QuizRequest): Promise<QuestionDraft[]> {
  const result = await generateJson({
    task: "diagnostic_quiz",
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(request),
    schema: aiQuizSchema,
  });

  return result.questions.slice(0, request.questionCount).map((question) => {
    const misconceptions = { A: "", B: "", C: "", D: "" };
    for (const distractor of question.distractors) {
      if (distractor.option !== question.correctOption) {
        misconceptions[distractor.option] = distractor.misconception.trim();
      }
    }
    return {
      content: question.content.trim(),
      options: question.options,
      correctOption: question.correctOption,
      misconceptions,
      explanation: question.explanation.trim(),
      difficulty: question.difficulty,
    };
  });
}
