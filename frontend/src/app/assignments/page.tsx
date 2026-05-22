"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAssignmentStore } from "@/store/assignmentStore";
import Header from "@/components/layout/Header";
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AssignmentsPage() {
  const {
    assignments,
    isLoading,
    fetchAssignments,
    deleteAssignment,
  } = useAssignmentStore();
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    await deleteAssignment(id);
    toast.success("Assignment deleted");
    fetchAssignments();
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Assignment" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Assignment" showBack />

      <div className="flex-1 p-4 lg:p-8">
        {assignments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <div className="relative mb-6">
              <div className="w-36 h-36 bg-gray-100 rounded-full flex items-center justify-center">
                <ClipboardList size={48} className="text-gray-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-2xl font-bold">&times;</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No assignments yet
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-md mb-8">
              Create your first assignment to start collecting and grading
              student submissions. You can set up rubrics, define marking
              criteria, and let AI assist with grading.
            </p>
            <Link href="/assignments/create" className="btn-primary">
              <Plus size={18} />
              Create Your First Assignment
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Assignments
                </h1>
              </div>
              <p className="text-sm text-gray-500 ml-4">
                Manage and create assignments for your classes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button className="btn-secondary text-xs gap-1.5">
                <Filter size={14} />
                Filter By
              </button>
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((assignment) => (
                <div key={assignment._id} className="card p-4 relative group">
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/assignments/${assignment._id}`}
                      className="text-sm font-semibold text-gray-900 hover:underline line-clamp-2 flex-1"
                    >
                      {assignment.title}
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === assignment._id
                              ? null
                              : assignment._id
                          )
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                      {menuOpenId === assignment._id && (
                        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                          <Link
                            href={`/assignments/${assignment._id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpenId(null)}
                          >
                            View Assignment
                          </Link>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      Assigned on :{" "}
                      {format(new Date(assignment.createdAt), "dd-MM-yyyy")}
                    </span>
                    {assignment.dueDate && (
                      <span>
                        Due :{" "}
                        {format(new Date(assignment.dueDate), "dd-MM-yyyy")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        assignment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : assignment.status === "processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : assignment.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <Link href="/assignments/create" className="btn-primary">
                <Plus size={18} />
                Create Assignment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
