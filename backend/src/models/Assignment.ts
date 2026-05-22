import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IQuestion {
  questionNumber: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  marks: number;
  type: string;
  options?: string[];
  correctOption?: string;
  matchPairs?: Array<{ left: string; right: string }>;
  blankAnswer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questionType: string;
  marksPerQuestion: number;
  questions: IQuestion[];
}

export interface IGeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: Array<{
    questionNumber: number;
    answer: string;
  }>;
}

export interface IAssignment extends Document {
  title: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions: string;
  totalQuestions: number;
  totalMarks: number;
  uploadedFileName?: string;
  uploadedFileContent?: string;
  status: "draft" | "processing" | "completed" | "failed";
  generatedPaper?: IGeneratedPaper;
  jobId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const QuestionSchema = new Schema<IQuestion>({
  questionNumber: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Moderate", "Hard"], required: true },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
  options: [{ type: String }],
  correctOption: { type: String },
  matchPairs: [{ left: String, right: String }],
  blankAnswer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questionType: { type: String, required: true },
  marksPerQuestion: { type: Number, required: true },
  questions: [QuestionSchema],
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>({
  schoolName: { type: String, default: "Delhi Public School, Sector-4, Bokaro" },
  subject: { type: String, default: "English" },
  className: { type: String, default: "5th" },
  timeAllowed: { type: String, default: "45 minutes" },
  maxMarks: { type: Number, required: true },
  sections: [SectionSchema],
  answerKey: [
    {
      questionNumber: Number,
      answer: String,
    },
  ],
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    additionalInstructions: { type: String, default: "" },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    uploadedFileName: { type: String },
    uploadedFileContent: { type: String },
    status: {
      type: String,
      enum: ["draft", "processing", "completed", "failed"],
      default: "draft",
    },
    generatedPaper: GeneratedPaperSchema,
    jobId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);
