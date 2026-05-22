"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAssignmentStore } from "@/store/assignmentStore";
import Header from "@/components/layout/Header";
import {
  Search,
  SlidersHorizontal,
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

  const hasAssignments = assignments.length > 0;

  if (isLoading && !hasAssignments) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Assignment" showBack showMobileBack={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      onClick={() => menuOpenId && setMenuOpenId(null)}
    >
      <Header title="Assignment" showBack showMobileBack={hasAssignments} />

      <div className="flex-1 p-4 lg:px-8 lg:py-6 relative">
        {assignments.length === 0 ? (
          /* ---- Empty State ---- */
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center">
                <ClipboardList size={52} className="text-gray-300" />
              </div>
              <div className="absolute bottom-0 right-2 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center border-4 border-white">
                <span className="text-red-500 text-2xl font-bold">&times;</span>
              </div>
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">
              No assignments yet
            </h2>
            <p className="text-[13px] text-gray-500 text-center max-w-sm mb-8 leading-relaxed px-4">
              Create your first assignment to start collecting and grading
              student submissions. You can set up rubrics, define marking
              criteria, and let AI assist with grading.
            </p>
            <Link
              href="/assignments/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D2D2D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors"
            >
              <Plus size={16} />
              Create Your First Assignment
            </Link>
          </div>
        ) : (
          <>
            {/* ---- Title (desktop) ---- */}
            <div className="mb-5 hidden lg:block">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <h1 className="text-[18px] font-bold text-gray-900">
                  Assignments
                </h1>
              </div>
              <p className="text-[12px] text-gray-500 ml-4">
                Manage and create assignments for your classes.
              </p>
            </div>

            {/* ---- Filter + Search row ---- */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <button className="flex items-center gap-1.5 px-1 py-2 text-[13px] text-gray-600 font-medium shrink-0 hover:text-gray-900 transition-colors">
                <SlidersHorizontal size={14} />
                <span className="hidden lg:inline">Filter By</span>
                <span className="lg:hidden">Filter</span>
              </button>
              <div className="relative w-full max-w-[300px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-full text-[12px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all hidden lg:block"
                />
                <input
                  type="text"
                  placeholder="Search Name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-full text-[12px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all lg:hidden"
                />
              </div>
            </div>

            {/* ---- Mobile: List view ---- */}
            <div className="flex flex-col gap-3 lg:hidden pb-24">
              {filtered.map((assignment) => (
                <div
                  key={assignment._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/assignments/${assignment._id}`}
                      className="text-[14px] font-bold text-gray-900 flex-1 pr-2"
                    >
                      {assignment.title}
                    </Link>
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === assignment._id
                              ? null
                              : assignment._id
                          )
                        }
                        className="p-1"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                      {menuOpenId === assignment._id && (
                        <div className="absolute right-0 top-7 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1.5">
                          <Link
                            href={`/assignments/${assignment._id}`}
                            className="block px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpenId(null)}
                          >
                            View Assignment
                          </Link>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="block w-full text-left px-4 py-2 text-[13px] text-[#EF4444] hover:bg-red-50 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10.5px] text-gray-500 font-medium">
                    <span className="whitespace-nowrap">
                      <span className="font-semibold text-gray-700">
                        Assigned on
                      </span>{" "}
                      : {format(new Date(assignment.createdAt), "dd-MM-yyyy")}
                    </span>
                    {assignment.dueDate && (
                      <span className="whitespace-nowrap">
                        <span className="font-semibold text-gray-700">
                          Due
                        </span>{" "}
                        : {format(new Date(assignment.dueDate), "dd-MM-yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ---- Desktop: 2-column grid with fade ---- */}
            <div className="hidden lg:block relative">
              <div className="grid grid-cols-2 gap-4 pb-32 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {filtered.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 relative"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <Link
                        href={`/assignments/${assignment._id}`}
                        className="text-[15px] font-bold text-gray-900 flex-1 pr-2 hover:text-gray-700"
                      >
                        {assignment.title}
                      </Link>
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === assignment._id
                                ? null
                                : assignment._id
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {menuOpenId === assignment._id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-10 py-1.5">
                            <Link
                              href={`/assignments/${assignment._id}`}
                              className="block px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
                              onClick={() => setMenuOpenId(null)}
                            >
                              View Assignment
                            </Link>
                            <button
                              onClick={() => handleDelete(assignment._id)}
                              className="block w-full text-left px-4 py-2 text-[13px] text-[#EF4444] hover:bg-red-50 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-gray-500 font-medium">
                      <span>
                        <span className="font-semibold text-gray-700">
                          Assigned on
                        </span>{" "}
                        : {format(new Date(assignment.createdAt), "dd-MM-yyyy")}
                      </span>
                      {assignment.dueDate && (
                        <span>
                          <span className="font-semibold text-gray-700">
                            Due
                          </span>{" "}
                          :{" "}
                          {format(new Date(assignment.dueDate), "dd-MM-yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Fade gradient + floating Create button (desktop) */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F0F0F0] via-[#F0F0F0]/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <Link
                  href="/assignments/create"
                  className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D2D2D] text-white rounded-full text-[13px] font-semibold hover:bg-[#3a3a3a] transition-colors shadow-lg"
                >
                  <Plus size={15} />
                  Create Assignment
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile FAB */}
      {hasAssignments && (
        <Link
          href="/assignments/create"
          className="lg:hidden fixed bottom-20 right-4 w-12 h-12 bg-[#E8704F] hover:bg-[#d4603f] text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
        >
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
}
