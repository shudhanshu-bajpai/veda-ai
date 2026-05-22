import { create } from "zustand";
import { Assignment, QuestionType } from "@/types";
import * as api from "@/lib/api";

interface AssignmentFormState {
  title: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  file: File | null;
}

interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  form: AssignmentFormState;

  setFormField: <K extends keyof AssignmentFormState>(
    key: K,
    value: AssignmentFormState[K]
  ) => void;
  addQuestionType: () => void;
  removeQuestionType: (index: number) => void;
  updateQuestionType: (
    index: number,
    field: keyof QuestionType,
    value: string | number
  ) => void;
  resetForm: () => void;

  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  createAssignment: () => Promise<string | null>;
  regenerateAssignment: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateAssignmentStatus: (
    id: string,
    status: Assignment["status"],
    paper?: Assignment["generatedPaper"]
  ) => void;
}

const defaultForm: AssignmentFormState = {
  title: "",
  dueDate: "",
  questionTypes: [
    { type: "Multiple Choice Questions", count: 4, marks: 1 },
  ],
  additionalInstructions: "",
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  isCreating: false,
  error: null,

  form: { ...defaultForm },

  setFormField: (key, value) =>
    set((state) => ({ form: { ...state.form, [key]: value } })),

  addQuestionType: () =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: [
          ...state.form.questionTypes,
          { type: "Short Questions", count: 3, marks: 2 },
        ],
      },
    })),

  removeQuestionType: (index) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.filter((_, i) => i !== index),
      },
    })),

  updateQuestionType: (index, field, value) =>
    set((state) => {
      const updated = [...state.form.questionTypes];
      updated[index] = { ...updated[index], [field]: value };
      return { form: { ...state.form, questionTypes: updated } };
    }),

  resetForm: () => set({ form: { ...defaultForm } }),

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const assignments = await api.fetchAssignments();
      set({ assignments, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch",
        isLoading: false,
      });
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const assignment = await api.fetchAssignment(id);
      set({ currentAssignment: assignment, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch",
        isLoading: false,
      });
    }
  },

  createAssignment: async () => {
    const { form } = get();
    set({ isCreating: true, error: null });
    try {
      const result = await api.createAssignment(
        {
          title: form.title,
          dueDate: form.dueDate,
          questionTypes: form.questionTypes,
          additionalInstructions: form.additionalInstructions,
        },
        form.file || undefined
      );
      set({ isCreating: false });
      get().resetForm();
      return result.id;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create",
        isCreating: false,
      });
      return null;
    }
  },

  regenerateAssignment: async (id) => {
    set({ error: null });
    try {
      await api.regenerateAssignment(id);
      set((state) => ({
        currentAssignment: state.currentAssignment
          ? { ...state.currentAssignment, status: "processing", generatedPaper: undefined }
          : null,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to regenerate",
      });
    }
  },

  deleteAssignment: async (id) => {
    try {
      await api.deleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete",
      });
    }
  },

  updateAssignmentStatus: (id, status, paper) =>
    set((state) => {
      const assignments = state.assignments.map((a) =>
        a._id === id ? { ...a, status, generatedPaper: paper || a.generatedPaper } : a
      );
      const currentAssignment =
        state.currentAssignment?._id === id
          ? { ...state.currentAssignment, status, generatedPaper: paper || state.currentAssignment.generatedPaper }
          : state.currentAssignment;
      return { assignments, currentAssignment };
    }),
}));
