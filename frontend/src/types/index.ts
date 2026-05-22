export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  questionNumber: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  marks: number;
  type: string;
}

export interface Section {
  title: string;
  instruction: string;
  questionType: string;
  marksPerQuestion: number;
  questions: Question[];
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
  answerKey: Array<{
    questionNumber: number;
    answer: string;
  }>;
}

export interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  totalQuestions: number;
  totalMarks: number;
  uploadedFileName?: string;
  status: "draft" | "processing" | "completed" | "failed";
  generatedPaper?: GeneratedPaper;
  jobId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
}

export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
  "Fill in the Blanks",
  "Match the Following",
] as const;
