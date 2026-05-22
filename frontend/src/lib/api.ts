import { Assignment, CreateAssignmentPayload } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `API error: ${res.status}`);
  }

  return data;
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const data = await apiFetch<{ success: boolean; assignments: Assignment[] }>(
    "/assignments"
  );
  return data.assignments;
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const data = await apiFetch<{ success: boolean; assignment: Assignment }>(
    `/assignments/${id}`
  );
  return data.assignment;
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
  file?: File
): Promise<{ id: string; jobId: string }> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));

  if (file) {
    formData.append("file", file);
  }

  const data = await apiFetch<{
    success: boolean;
    assignment: { id: string; jobId: string };
  }>("/assignments", {
    method: "POST",
    body: formData,
  });

  return data.assignment;
}

export async function regenerateAssignment(
  id: string
): Promise<{ jobId: string }> {
  const data = await apiFetch<{
    success: boolean;
    jobId: string;
  }>(`/assignments/${id}/regenerate`, { method: "POST" });

  return { jobId: data.jobId };
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiFetch(`/assignments/${id}`, { method: "DELETE" });
}
