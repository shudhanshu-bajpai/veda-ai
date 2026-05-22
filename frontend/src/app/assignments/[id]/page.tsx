"use client";

import { useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { GeneratedPaper, Question } from "@/types";
import {
  Download,
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Easy: "text-green-700",
    Moderate: "text-yellow-700",
    Hard: "text-red-700",
    Challenging: "text-red-700",
  };

  return (
    <span className={`text-[13px] font-medium ${colors[level] || "text-gray-600"}`}>
      [{level}]
    </span>
  );
}

function QuestionRenderer({ question: q }: { question: Question }) {
  const type = q.type?.toLowerCase() || "";
  const isMCQ = type.includes("multiple choice");
  const isTF = type.includes("true") && type.includes("false");
  const isFill = type.includes("fill");
  const isMatch = type.includes("match");

  return (
    <div className="flex gap-2 text-[13px] leading-relaxed">
      <span className="font-medium text-gray-800 shrink-0">
        {q.questionNumber}.
      </span>
      <div className="flex-1">
        <span className="text-gray-800">
          <DifficultyBadge level={q.difficulty} />{" "}
          {q.text}{" "}
          <span className="text-gray-500">
            [{q.marks} Mark{q.marks > 1 ? "s" : ""}]
          </span>
        </span>

        {/* MCQ Options */}
        {isMCQ && q.options && q.options.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2 ml-1">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-start gap-2 text-gray-700">
                <span className="w-5 h-5 rounded-full border border-gray-300 shrink-0 mt-0.5" />
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* True/False Options */}
        {isTF && (
          <div className="flex gap-8 mt-2 ml-1">
            {(q.options && q.options.length > 0
              ? q.options
              : ["True", "False"]
            ).map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-700">
                <span className="w-4 h-4 rounded-sm border border-gray-300 shrink-0" />
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Fill in the Blanks — answer line */}
        {isFill && !q.text?.includes("________") && (
          <div className="mt-2 ml-1">
            <span className="text-gray-500">Answer: </span>
            <span className="inline-block border-b border-gray-400 min-w-[150px]" />
          </div>
        )}

        {/* Match the Following */}
        {isMatch && q.matchPairs && q.matchPairs.length > 0 && (
          <div className="mt-3 ml-1 border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-100 text-xs font-semibold text-gray-600">
              <div className="px-3 py-2 border-r border-gray-200">Column A</div>
              <div className="px-3 py-2">Column B</div>
            </div>
            {q.matchPairs.map((pair, i) => (
              <div
                key={i}
                className="grid grid-cols-2 text-gray-700 border-t border-gray-200"
              >
                <div className="px-3 py-2 border-r border-gray-200">
                  {String.fromCharCode(97 + i)}) {pair.left}
                </div>
                <div className="px-3 py-2">
                  {String.fromCharCode(105 + i)}) {pair.right}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionPaperView({ paper }: { paper: GeneratedPaper }) {
  return (
    <div className="bg-white max-w-4xl mx-auto" id="question-paper">
      {/* School Header */}
      <div className="text-center mb-6">
        <h1 className="text-[20px] lg:text-[24px] font-bold text-gray-900 mb-1">
          {paper.schoolName}
        </h1>
        <p className="text-[14px] text-gray-600">Subject: {paper.subject}</p>
        <p className="text-[14px] text-gray-600">Class: {paper.className}</p>
      </div>

      {/* Meta Info */}
      <div className="flex justify-between items-center mb-3 text-[13px]">
        <span className="text-gray-700 font-medium">
          Time Allowed: {paper.timeAllowed}
        </span>
        <span className="text-gray-700 font-medium">
          Maximum Marks: {paper.maxMarks}
        </span>
      </div>

      <p className="text-[13px] text-gray-600 italic mb-6">
        All questions are compulsory unless stated otherwise.
      </p>

      {/* Student Info */}
      <div className="mb-8 space-y-1.5 text-[13px]">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">Name:</span>
          <span className="flex-1 border-b border-gray-400 max-w-[200px]" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">Roll Number:</span>
          <span className="flex-1 border-b border-gray-400 max-w-[160px]" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">Class: {paper.className} Section:</span>
          <span className="flex-1 border-b border-gray-400 max-w-[100px]" />
        </div>
      </div>

      {/* Sections */}
      {paper.sections.map((section, sIdx) => (
        <div key={sIdx} className="mb-8">
          <h2 className="text-center text-[16px] font-bold text-gray-900 mb-3">
            {section.title}
          </h2>
          <h3 className="text-[14px] font-bold text-gray-800 mb-0.5">
            {section.questionType}
          </h3>
          <p className="text-[13px] italic text-gray-500 mb-4">
            {section.instruction}
          </p>

          <ol className="space-y-4">
            {section.questions.map((q) => (
              <li key={q.questionNumber}>
                <QuestionRenderer question={q} />
              </li>
            ))}
          </ol>
        </div>
      ))}

      <div className="text-center py-4 text-[13px] font-bold text-gray-700 mt-4">
        End of Question Paper
      </div>

      {/* Answer Key */}
      {paper.answerKey && paper.answerKey.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">
            Answer Key:
          </h2>
          <ol className="space-y-2.5">
            {paper.answerKey.map((ak) => (
              <li
                key={ak.questionNumber}
                className="flex gap-2 text-[13px]"
              >
                <span className="font-medium text-gray-700 shrink-0">
                  {ak.questionNumber}.
                </span>
                <span className="text-gray-700 leading-relaxed">{ak.answer}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const paperRef = useRef<HTMLDivElement>(null);

  const {
    currentAssignment,
    isLoading,
    fetchAssignment,
    regenerateAssignment,
    updateAssignmentStatus,
  } = useAssignmentStore();

  const handleWsMessage = useCallback(
    (data: Record<string, unknown>) => {
      if (
        data.type === "assignment_update" &&
        data.assignmentId === id
      ) {
        const status = data.status as string;
        if (status === "completed") {
          toast.success("Question paper generated!");
          updateAssignmentStatus(
            id,
            "completed",
            data.paper as GeneratedPaper | undefined
          );
          fetchAssignment(id);
        } else if (status === "failed") {
          toast.error(data.message as string);
          updateAssignmentStatus(id, "failed");
        } else if (status === "processing") {
          updateAssignmentStatus(id, "processing");
        }
      }
    },
    [id, updateAssignmentStatus, fetchAssignment]
  );

  useWebSocket(id, handleWsMessage);

  useEffect(() => {
    if (id) fetchAssignment(id);
  }, [id, fetchAssignment]);

  useEffect(() => {
    if (currentAssignment?.status === "processing") {
      const interval = setInterval(() => {
        fetchAssignment(id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentAssignment?.status, id, fetchAssignment]);

  const handleDownloadPDF = async () => {
    toast.loading("Generating PDF...", { id: "pdf" });
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/assignments/${id}/pdf`);

      if (!res.ok) {
        throw new Error("PDF generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentAssignment?.title?.replace(/\s+/g, "_") || "question_paper"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded!", { id: "pdf" });
    } catch {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  const handleRegenerate = async () => {
    await regenerateAssignment(id);
    toast.success("Regenerating question paper...");
  };

  if (isLoading && !currentAssignment) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Assignment" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading assignment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Assignment" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={32} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Assignment not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Create New" showBack />

      <div className="flex-1 p-4 lg:p-8">
        {/* AI Message Bar */}
        {currentAssignment.status === "completed" &&
          currentAssignment.generatedPaper && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-[#2D2D2D] text-white rounded-xl p-4 lg:p-5">
                <p className="text-[13px] leading-relaxed mb-3">
                  Certainly, Lakshya! Here are customized Question Paper for
                  your CBSE Grade 8 Science classes on the NCERT chapters:
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-gray-600 rounded-lg text-[13px] font-medium transition-colors"
                >
                  <Download size={15} />
                  Download as PDF
                </button>
              </div>
            </div>
          )}

        {/* Processing State */}
        {currentAssignment.status === "processing" && (
          <div className="max-w-4xl mx-auto">
            <div className="card p-12 text-center">
              <Loader2
                size={48}
                className="animate-spin text-gray-400 mx-auto mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Generating Question Paper
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Our AI is crafting your question paper. This usually takes
                15-30 seconds. The page will update automatically.
              </p>
              <div className="mt-6 w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Failed State */}
        {currentAssignment.status === "failed" && (
          <div className="max-w-4xl mx-auto">
            <div className="card p-12 text-center">
              <AlertCircle
                size={48}
                className="text-red-400 mx-auto mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Generation Failed
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                {currentAssignment.errorMessage ||
                  "Something went wrong while generating the question paper."}
              </p>
              <button onClick={handleRegenerate} className="btn-primary">
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Completed — Show Paper */}
        {currentAssignment.status === "completed" &&
          currentAssignment.generatedPaper && (
            <>
              {/* Action Bar */}
              <div className="max-w-4xl mx-auto mb-4 flex justify-end gap-3 no-print">
                <button onClick={handleRegenerate} className="btn-secondary text-xs">
                  <RefreshCw size={14} />
                  Regenerate
                </button>
                <button onClick={handleDownloadPDF} className="btn-primary text-xs">
                  <Download size={14} />
                  Download PDF
                </button>
              </div>

              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-6 lg:p-10" ref={paperRef}>
                <QuestionPaperView paper={currentAssignment.generatedPaper} />
              </div>
            </>
          )}

        {/* Draft State */}
        {currentAssignment.status === "draft" && (
          <div className="max-w-4xl mx-auto">
            <div className="card p-12 text-center">
              <p className="text-sm text-gray-500">
                This assignment is in draft state. It will start processing
                shortly.
              </p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="max-w-4xl mx-auto mt-6 no-print">
          <button
            onClick={() => router.push("/assignments")}
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Back to Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
