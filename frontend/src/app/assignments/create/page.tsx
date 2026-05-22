"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useAssignmentStore } from "@/store/assignmentStore";
import { QUESTION_TYPE_OPTIONS } from "@/types";
import {
  X,
  Plus,
  Minus,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  FileText,
  Mic,
  CalendarPlus,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    form,
    setFormField,
    addQuestionType,
    removeQuestionType,
    updateQuestionType,
    createAssignment,
    isCreating,
  } = useAssignmentStore();

  const totalQuestions = form.questionTypes.reduce(
    (sum, qt) => sum + qt.count,
    0
  );
  const totalMarks = form.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.dueDate) errs.dueDate = "Due date is required";
    if (form.questionTypes.length === 0)
      errs.questionTypes = "Add at least one question type";
    form.questionTypes.forEach((qt, i) => {
      if (!qt.type) errs[`qt_type_${i}`] = "Select a question type";
      if (qt.count < 1) errs[`qt_count_${i}`] = "At least 1 question";
      if (qt.marks < 1) errs[`qt_marks_${i}`] = "Marks must be positive";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (file: File) => {
    const allowed = ["application/pdf", "text/plain", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, TXT, PNG, JPG files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFormField("file", file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before proceeding");
      return;
    }
    // Auto-generate title from question types if missing
    if (!form.title.trim()) {
      setFormField("title", `Assignment — ${new Date().toLocaleDateString("en-GB")}`);
    }
    const id = await createAssignment();
    if (id) {
      toast.success("Assignment created! Generating question paper...");
      router.push(`/assignments/${id}`);
    } else {
      toast.error("Failed to create assignment");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Assignment" showBack />

      <div className="flex-1 px-4 pb-6 lg:px-8 lg:pb-8 max-w-3xl mx-auto w-full">
        {/* Page Title */}
        <div className="mb-5 pt-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <h1 className="text-[18px] font-bold text-gray-900">
              Create Assignment
            </h1>
          </div>
          <p className="text-[12px] text-gray-500 ml-4">
            Set up a new assignment for your students
          </p>
        </div>

        {/* Progress Bar — two segments */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 h-1 rounded-full bg-[#2D2D2D]" />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 2 ? "bg-[#2D2D2D]" : "bg-gray-200"
            }`}
          />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 lg:p-8">
          {step === 1 && (
            <>
              <h2 className="text-[17px] font-bold text-gray-900 mb-1">
                Assignment Details
              </h2>
              <p className="text-[12px] text-gray-500 mb-6">
                Basic information about your assignment
              </p>

              {/* File Upload */}
              <div className="mb-2">
                <div
                  className={`border border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-300 hover:border-gray-400 bg-white"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={22} className="text-gray-500" />
                      <span className="text-[13px] font-medium text-gray-700">
                        {form.file.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormField("file", null);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud
                        size={28}
                        className="mx-auto mb-2.5 text-gray-700"
                        strokeWidth={1.7}
                      />
                      <p className="text-[14px] font-semibold text-gray-800 mb-0.5">
                        Choose a file or drag &amp; drop it here
                      </p>
                      <p className="text-[11px] text-gray-400 mb-3">
                        JPEG, PNG, upto 10MB
                      </p>
                      <button
                        type="button"
                        className="px-5 py-1.5 border border-gray-300 rounded-full text-[12px] text-gray-700 font-medium bg-white hover:bg-gray-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Browse Files
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  Upload images of your preferred document/image
                </p>
              </div>

              {/* Due Date */}
              <div className="mt-6 mb-5">
                <label className="block text-[13px] font-bold text-gray-900 mb-2">
                  Due Date
                </label>
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1 relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setFormField("dueDate", e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white border rounded-full text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all ${
                        errors.dueDate ? "border-red-400" : "border-gray-200"
                      }`}
                      placeholder="DD-MM-YYYY"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                    className="w-10 h-10 self-center flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-label="Open calendar"
                  >
                    <CalendarPlus size={16} className="text-gray-600" />
                  </button>
                </div>
                {errors.dueDate && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.dueDate}
                  </p>
                )}
              </div>

              {/* Question Types */}
              <div className="mb-2">
                <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_24px_120px_120px] gap-3 items-center mb-3">
                  <label className="text-[13px] font-bold text-gray-900">
                    Question Type
                  </label>
                  <span />
                  <span className="text-[12px] font-semibold text-gray-700 text-center">
                    No. of Questions
                  </span>
                  <span className="text-[12px] font-semibold text-gray-700 text-center">
                    Marks
                  </span>
                </div>

                <div className="space-y-3">
                  {form.questionTypes.map((qt, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_24px_120px_120px] gap-3 items-center"
                    >
                      {/* Type select */}
                      <div className="relative">
                        <select
                          value={qt.type}
                          onChange={(e) =>
                            updateQuestionType(index, "type", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-full text-[13px] text-gray-800 appearance-none pr-9 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
                        >
                          <option value="">Select type...</option>
                          {QUESTION_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeQuestionType(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove"
                      >
                        <X size={16} />
                      </button>

                      {/* Count counter */}
                      <Counter
                        value={qt.count}
                        onChange={(v) => updateQuestionType(index, "count", v)}
                      />

                      {/* Marks counter */}
                      <Counter
                        value={qt.marks}
                        onChange={(v) => updateQuestionType(index, "marks", v)}
                      />
                    </div>
                  ))}
                </div>

                {/* Add Question Type */}
                <button
                  onClick={addQuestionType}
                  className="flex items-center gap-2.5 mt-4 text-[13px] text-gray-800 hover:text-gray-900 font-medium group"
                >
                  <div className="w-7 h-7 bg-[#2D2D2D] group-hover:bg-[#3a3a3a] rounded-full flex items-center justify-center transition-colors">
                    <Plus size={14} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span>Add Question Type</span>
                </button>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end gap-1 mt-5 mb-6 text-[13px] text-gray-700">
                <span>
                  <span className="font-semibold">Total Questions</span> :{" "}
                  <span className="font-semibold">{totalQuestions}</span>
                </span>
                <span>
                  <span className="font-semibold">Total Marks</span> :{" "}
                  <span className="font-semibold">{totalMarks}</span>
                </span>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">
                  Additional Information (For better output)
                </label>
                <div className="relative">
                  <textarea
                    value={form.additionalInstructions}
                    onChange={(e) =>
                      setFormField("additionalInstructions", e.target.value)
                    }
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Voice input"
                  >
                    <Mic size={15} />
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[17px] font-bold text-gray-900 mb-1">
                Review &amp; Generate
              </h2>
              <p className="text-[12px] text-gray-500 mb-6">
                Review your assignment details before generating
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">Due Date</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {form.dueDate}
                  </span>
                </div>
                {form.file && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-[13px] text-gray-500">
                      Uploaded File
                    </span>
                    <span className="text-[13px] font-semibold text-gray-900">
                      {form.file.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">
                    Total Questions
                  </span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">Total Marks</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {totalMarks}
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="text-[13px] font-semibold text-gray-700 mb-2.5">
                    Question Types
                  </h3>
                  <div className="space-y-2">
                    {form.questionTypes.map((qt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
                      >
                        <span className="text-[13px] text-gray-700">
                          {qt.type}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {qt.count} questions &times; {qt.marks} marks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {form.additionalInstructions && (
                  <div className="pt-2">
                    <h3 className="text-[13px] font-semibold text-gray-700 mb-2">
                      Additional Instructions
                    </h3>
                    <p className="text-[12px] text-gray-600 bg-gray-50 rounded-xl p-3">
                      {form.additionalInstructions}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => (step === 1 ? router.back() : setStep(1))}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            Previous
          </button>

          {step === 1 ? (
            <button
              onClick={() => {
                if (validate()) setStep(2);
                else toast.error("Please fix the errors");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D2D2D] text-white rounded-full text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              Next
              <ArrowRight size={14} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D2D2D] text-white rounded-full text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Paper
                  <ArrowRight size={14} strokeWidth={2.2} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Counter sub-component (pill with - / value / +) ---------- */
function Counter({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full px-1 h-9 w-[110px] mx-auto">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-full transition-colors"
        aria-label="Decrease"
      >
        <Minus size={13} strokeWidth={2} />
      </button>
      <span className="text-[14px] font-medium text-gray-800 min-w-[20px] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-full transition-colors"
        aria-label="Increase"
      >
        <Plus size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
