"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useAssignmentStore } from "@/store/assignmentStore";
import { QUESTION_TYPE_OPTIONS } from "@/types";
import {
  Upload,
  X,
  Plus,
  Minus,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  FileText,
  Mic,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    if (!form.title.trim()) errs.title = "Title is required";
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
    const allowed = [
      "application/pdf",
      "text/plain",
      "image/png",
      "image/jpeg",
    ];
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

      <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            <h1 className="text-xl font-semibold text-gray-900">
              Create Assignment
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Set up a new assignment for your students.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        <div className="card p-6 lg:p-8">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Assignment Details
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Basic information about your assignment
              </p>

              {/* Title */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quiz on Electricity"
                  value={form.title}
                  onChange={(e) => setFormField("title", e.target.value)}
                  className={`input-field ${errors.title ? "border-red-400 focus:ring-red-200" : ""}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-5">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-300 hover:border-gray-400"
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
                      <FileText size={24} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {form.file.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormField("file", null);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload
                        size={28}
                        className="mx-auto mb-3 text-gray-400"
                      />
                      <p className="text-sm text-gray-600 mb-1">
                        Choose a file or drag & drop it here
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        JPEG, PNG, upto 10MB
                      </p>
                      <button
                        type="button"
                        className="btn-secondary text-xs"
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
                <p className="text-xs text-gray-400 mt-2">
                  Upload images of your preferred document/image
                </p>
              </div>

              {/* Due Date */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setFormField("dueDate", e.target.value)}
                  className={`input-field ${errors.dueDate ? "border-red-400 focus:ring-red-200" : ""}`}
                  placeholder="DD-MM-YYYY"
                />
                {errors.dueDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>
                )}
              </div>

              {/* Question Types */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <div className="flex gap-16 text-sm font-medium text-gray-700">
                    <span>No. of Questions</span>
                    <span>Marks</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.questionTypes.map((qt, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="relative flex-1 min-w-[200px]">
                        <select
                          value={qt.type}
                          onChange={(e) =>
                            updateQuestionType(index, "type", e.target.value)
                          }
                          className="input-field appearance-none pr-8"
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

                      <button
                        onClick={() =>
                          removeQuestionType(index)
                        }
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            updateQuestionType(
                              index,
                              "count",
                              Math.max(1, qt.count - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={qt.count}
                          onChange={(e) =>
                            updateQuestionType(
                              index,
                              "count",
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-12 text-center input-field px-1"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            updateQuestionType(index, "count", qt.count + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            updateQuestionType(
                              index,
                              "marks",
                              Math.max(1, qt.marks - 1)
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={qt.marks}
                          onChange={(e) =>
                            updateQuestionType(
                              index,
                              "marks",
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-12 text-center input-field px-1"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            updateQuestionType(index, "marks", qt.marks + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestionType}
                  className="flex items-center gap-2 mt-3 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus size={14} className="text-blue-600" />
                  </div>
                  Add Question Type
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-end gap-6 text-sm text-gray-600 mb-5">
                <span>
                  Total Questions : <strong>{totalQuestions}</strong>
                </span>
                <span>
                  Total Marks : <strong>{totalMarks}</strong>
                </span>
              </div>

              {/* Additional Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Information (For better output)
                </label>
                <div className="relative">
                  <textarea
                    value={form.additionalInstructions}
                    onChange={(e) =>
                      setFormField("additionalInstructions", e.target.value)
                    }
                    placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                    rows={3}
                    className="input-field resize-none pr-10"
                  />
                  <Mic
                    size={18}
                    className="absolute right-3 bottom-3 text-gray-400"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Review & Generate
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Review your assignment details before generating
              </p>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Title</span>
                  <span className="text-sm font-medium text-gray-900">
                    {form.title}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {form.dueDate}
                  </span>
                </div>
                {form.file && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Uploaded File</span>
                    <span className="text-sm font-medium text-gray-900">
                      {form.file.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Total Questions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Total Marks</span>
                  <span className="text-sm font-medium text-gray-900">
                    {totalMarks}
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Question Types
                  </h3>
                  <div className="space-y-2">
                    {form.questionTypes.map((qt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
                      >
                        <span className="text-sm text-gray-700">
                          {qt.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {qt.count} questions &times; {qt.marks} marks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {form.additionalInstructions && (
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Additional Instructions
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
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
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          {step === 1 ? (
            <button
              onClick={() => {
                if (validate()) setStep(2);
                else toast.error("Please fix the errors");
              }}
              className="btn-primary"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="btn-primary"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Paper
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
