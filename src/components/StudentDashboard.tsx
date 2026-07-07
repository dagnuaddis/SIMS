import React, { useState } from "react";
import { BookOpen, Calendar, HelpCircle, FileText, Award, AlertTriangle, MessageSquare, Sparkles, Send, CheckCircle2, ChevronRight, User } from "lucide-react";
import { Student, DBStructure, Course, Registration, Grade, AdvisingSession, Appeal } from "../types";

interface StudentDashboardProps {
  student: Student;
  db: DBStructure;
  onRegisterCourses: (courseCodes: string[]) => Promise<void>;
  onSubmitAppeal: (courseCode: string, reason: string) => Promise<void>;
  onViewDoc: (type: "transcript" | "diploma") => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  db,
  onRegisterCourses,
  onSubmitAppeal,
  onViewDoc,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"courses" | "grades" | "advising" | "graduation">("grades");
  
  // Registration States
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Appeal States
  const [appealCourse, setAppealCourse] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealSuccess, setAppealSuccess] = useState(false);

  // Helper selectors
  const studentGrades = db.grades.filter((g) => g.studentId === student.id);
  const studentRegistrations = db.registrations.filter((r) => r.studentId === student.id);
  const studentAppeals = db.appeals.filter((a) => a.studentId === student.id);
  const studentAdvising = db.advisingSessions.filter((s) => s.studentId === student.id);
  const studentDiscipline = db.disciplineCases.filter((d) => d.studentId === student.id);

  const getCourseCredits = (code: string) => db.courses.find((c) => c.code === code)?.credits || 3;
  const getCourseName = (code: string) => db.courses.find((c) => c.code === code)?.name || code;

  // Handle course checkbox toggles
  const toggleCourseSelect = (code: string) => {
    setRegSuccess(false);
    setRegError("");
    if (selectedCourses.includes(code)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== code));
    } else {
      setSelectedCourses([...selectedCourses, code]);
    }
  };

  // Register Courses
  const handleRegisterSubmit = async () => {
    if (selectedCourses.length === 0) {
      setRegError("Please select at least one course.");
      return;
    }
    setRegError("");
    try {
      await onRegisterCourses(selectedCourses);
      setRegSuccess(true);
      setSelectedCourses([]);
    } catch (err: any) {
      setRegError(err.message || "Course registration failed.");
    }
  };

  // Submit Grade Appeal
  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealCourse || !appealReason.trim()) return;
    try {
      await onSubmitAppeal(appealCourse, appealReason);
      setAppealSuccess(true);
      setAppealCourse("");
      setAppealReason("");
      setTimeout(() => setAppealSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Determine current semester course offerings (filtering courses in student's department)
  const availableOfferings = db.courses.filter(
    (c) => c.department === student.department && 
    !studentGrades.some((g) => g.courseCode === c.code && g.status === "Finalized")
  );

  return (
    <div className="space-y-6">
      {/* Student Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Cumulative GPA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">{student.cgpa.toFixed(2)}</span>
            <span className="text-xs text-slate-500">/ 4.00</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Semester GPA: <strong className="text-slate-700 font-mono">{student.gpa.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Completed Credits</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{student.creditHoursCompleted}</span>
            <span className="text-xs text-slate-500">Credit Hours</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Degree requirements progress: <strong className="text-slate-700">{Math.round((student.creditHoursCompleted / 120) * 100)}%</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Academic Status</span>
          <div className="mt-2">
            {student.status === "Active" ? (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">
                Active / Good Standing
              </span>
            ) : student.status === "Warning" ? (
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max">
                <AlertTriangle className="w-3.5 h-3.5" /> Warning State
              </span>
            ) : (
              <span className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold">
                {student.status}
              </span>
            )}
          </div>
          <div className="mt-2.5 text-[10px] text-slate-500">
            Advisor: <strong className="text-slate-700">Wzo. Almaz Negash</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Registered Courses</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {studentRegistrations.filter((r) => r.status === "Approved").length}
            </span>
            <span className="text-xs text-slate-500">Active Courses</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Pending Approval: <strong className="text-slate-700">{studentRegistrations.filter((r) => r.status === "Pending_Advisor").length}</strong>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border border-slate-200/60 gap-1 shrink-0 bg-slate-100 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveSubTab("grades")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeSubTab === "grades" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Grades & Appeals
        </button>
        <button
          onClick={() => setActiveSubTab("courses")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeSubTab === "courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Registration Portal
        </button>
        <button
          onClick={() => setActiveSubTab("advising")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeSubTab === "advising" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Academic Advising
        </button>
        <button
          onClick={() => setActiveSubTab("graduation")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeSubTab === "graduation" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Graduation & Clearance
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* Grades and Appeals Panel */}
      {activeSubTab === "grades" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-800">Current Course Grades</h3>
                <span className="text-[10px] text-slate-400 font-mono font-medium">Academic Year 2026</span>
              </div>
              
              <div className="divide-y divide-slate-150">
                {studentGrades.length > 0 ? (
                  studentGrades.map((grade) => (
                    <div key={grade.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span>{grade.courseCode}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{getCourseName(grade.courseCode)}</span>
                        </div>
                        <div className="mt-1.5 flex gap-4 text-[10px] text-slate-500 font-medium">
                          <span>Continuous Assessment: <strong className="text-slate-700 font-mono">{grade.continuousAssessment}/60</strong></span>
                          <span>Final Exam: <strong className="text-slate-700 font-mono">{grade.finalExam}/40</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-sm font-bold font-mono ${grade.total >= 75 ? 'text-emerald-600' : grade.total >= 50 ? 'text-slate-800' : 'text-red-500'}`}>
                            {grade.letterGrade}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">Total: {grade.total}/100</div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold font-mono tracking-wider border ${
                          grade.status === "Finalized" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {grade.status === "Finalized" ? "Finalized" : "Pending Lock"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 font-medium">
                    No academic grade records exist yet for this semester. Instructors are currently processing Continuous Assessments.
                  </div>
                )}
              </div>
            </div>

            {/* Past Infractions list */}
            {studentDiscipline.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5 mb-3 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Disciplinary Warning Files
                </h4>
                {studentDiscipline.map((disc) => (
                  <div key={disc.id} className="text-xs text-rose-900 space-y-1.5 bg-white p-3 rounded-lg border border-rose-200/50">
                    <div className="flex justify-between font-bold text-rose-950">
                      <span>Violation: {disc.violation}</span>
                      <span className="font-mono text-[10px] text-rose-500">{disc.date}</span>
                    </div>
                    <p className="text-[11px] text-rose-800/80 leading-relaxed">{disc.description}</p>
                    <div className="text-[10px] text-rose-700 pt-1 font-medium">
                      Warning Level: <span className="font-bold">{disc.warningLevel}</span> • Penalty: <span className="italic">{disc.penalty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appeal Grade Sheet Form */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3">Submit Grade Re-Marking Appeal</h3>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                If you believe a grading discrepancy occurred on a finalized course grade, submit a re-marking appeal. Requests are audited by the Department Head and Approval Committee.
              </p>

              <form onSubmit={handleAppealSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                    Select Course Grade
                  </label>
                  <select
                    value={appealCourse}
                    onChange={(e) => setAppealCourse(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Finalized Course --</option>
                    {studentGrades
                      .filter((g) => g.status === "Finalized")
                      .map((g) => (
                        <option key={g.id} value={g.courseCode}>
                          {g.courseCode} - {getCourseName(g.courseCode)} ({g.letterGrade})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                    Reason / Ground for Appeal
                  </label>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Provide specific details. (e.g. error in exam question addition, strict marking on question 3...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {appealSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Appeal filed. Tracking ID generated.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!appealCourse}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  Submit Appeal to Registrar
                </button>
              </form>
            </div>

            {/* Active Appeals List */}
            {studentAppeals.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 mb-3">My Re-Marking Appeals</h3>
                <div className="space-y-3">
                  {studentAppeals.map((app) => (
                    <div key={app.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-2">
                      <div className="flex justify-between font-mono font-bold text-slate-800">
                        <span>{app.courseCode} Appeal</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase border font-bold ${
                          app.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          app.status === "Resolved_Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {app.status === "Resolved_Approved" ? "Approved" : app.status === "Resolved_Rejected" ? "Rejected" : "Under Review"}
                        </span>
                      </div>
                      <p className="text-slate-600 italic">" {app.reason} "</p>
                      {app.resolverNotes && (
                        <div className="mt-2 bg-white p-2.5 rounded border border-slate-200 text-slate-700 text-xs">
                          <strong className="text-slate-900 font-bold">Resolution:</strong> {app.resolverNotes}
                          {app.newLetterGrade && (
                            <div className="mt-1 font-bold text-emerald-600 font-mono text-[10px]">
                              Revised Grade: {app.originalGrade} ({app.originalTotal}) {"\u2192"} {app.newLetterGrade} ({app.newTotal})
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Module */}
      {activeSubTab === "courses" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-sm text-slate-800">Course Registration Panel</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">
              Register for courses in your program. Submissions are flagged for **Academic Advisor** approval. 
              Maximum registration limit: **18 Credit Hours**.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Available Department Offerings
              </h4>

              <div className="space-y-2">
                {availableOfferings.map((course) => {
                  const isChecked = selectedCourses.includes(course.code);
                  const isPending = studentRegistrations.some((r) => r.courseCode === course.code && r.status === "Pending_Advisor");
                  const isApproved = studentRegistrations.some((r) => r.courseCode === course.code && r.status === "Approved");
                  
                  // Prerequisite checks
                  const unmetPrereqs = course.prerequisites.filter(
                    (pre) => !studentGrades.some((g) => g.courseCode === pre && g.status === "Finalized" && ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"].includes(g.letterGrade))
                  );
                  const prereqsUnmet = unmetPrereqs.length > 0;

                  return (
                    <div
                      key={course.code}
                      onClick={() => !prereqsUnmet && !isPending && !isApproved && toggleCourseSelect(course.code)}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                        isApproved ? "bg-emerald-50/30 border-emerald-200 text-slate-700" :
                        isPending ? "bg-amber-50/40 border-amber-200 text-slate-700" :
                        prereqsUnmet ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" :
                        isChecked ? "bg-emerald-50 border-emerald-300 text-slate-900 cursor-pointer shadow-xs" :
                        "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked || isApproved || isPending}
                          disabled={prereqsUnmet || isPending || isApproved}
                          readOnly
                          className="mt-1 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300 bg-white"
                        />
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{course.code}</span>
                            <span className="text-[10px] text-slate-500 font-normal truncate">{course.name}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold mt-1">
                            Credits: {course.credits} CH • Prerequisites: {course.prerequisites.length > 0 ? course.prerequisites.join(", ") : "None"}
                          </div>
                          {prereqsUnmet && (
                            <div className="text-[9px] text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Unmet prerequisite: {unmetPrereqs.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-4 font-bold">
                        {isApproved ? (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-2.5 py-0.5 rounded uppercase">
                            Approved
                          </span>
                        ) : isPending ? (
                          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[9px] px-2.5 py-0.5 rounded uppercase">
                            Pending Advisor
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">
                            {course.credits} Credits
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration Summary Ticket */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-max space-y-4">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                Registration Summary
              </h4>

              <div className="space-y-2 border-b border-slate-200 pb-3">
                {selectedCourses.length > 0 ? (
                  selectedCourses.map((code) => (
                    <div key={code} className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-slate-700">{code}</span>
                      <span className="text-slate-500">{getCourseCredits(code)} Credits</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs text-center py-4 font-medium">No courses selected</div>
                )}
              </div>

              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Total Selection credits:</span>
                <span className="text-emerald-700 font-mono">
                  {selectedCourses.reduce((sum, c) => sum + getCourseCredits(c), 0)} Credits
                </span>
              </div>

              {regError && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-700 text-[10px] flex items-start gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                  <p className="font-medium">{regError}</p>
                </div>
              )}

              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-700 text-[10px] flex items-start gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-bounce text-emerald-600" />
                  <p className="font-medium">Registration submitted to Wzo. Almaz Negash (Academic Advisor) for review.</p>
                </div>
              )}

              <button
                onClick={handleRegisterSubmit}
                disabled={selectedCourses.length === 0}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Submit Course Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Advising file and counseling notes */}
      {activeSubTab === "advising" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Academic Advising & Intervention File
              </h3>
              <p className="text-[11px] text-slate-500 mb-6 leading-relaxed font-medium">
                Your assigned advisor conducts academic counselling, tracks your performance, and maintains intervention plans. Below are the registered logs of advising sessions.
              </p>

              <div className="space-y-4">
                {studentAdvising.length > 0 ? (
                  studentAdvising.map((session) => (
                    <div key={session.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <div className="text-[10px] text-slate-500 font-bold">
                          Advisor: <strong className="text-slate-800 font-bold">Wzo. Almaz Negash</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">Date: {session.date}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                            Counselling Notes
                          </h4>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                            {session.notes}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                            Actionable Recommendations
                          </h4>
                          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                            {session.recommendation}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                          Academic Intervention Program (AIP)
                        </h4>
                        <p className="text-emerald-800 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 text-xs font-semibold">
                          {session.interventionPlan}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl font-medium">
                    No historic academic counselling sessions registered on file.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI-powered predictive panel insight */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-600 mb-2 border-b border-slate-150 pb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ATTC AI-PREDICT ENGINE</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-3">AI Advisor Risk Assessment</h3>
              
              {studentAdvising.some((s) => s.aiInsights) ? (
                <div className="space-y-3.5">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-line font-sans font-medium">
                    {studentAdvising.find((s) => s.aiInsights)?.aiInsights}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono text-center">
                    *Automated prediction calculated utilizing Gemini NLP models & core grade vectors.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    No active AI counseling file generated. Your advisor can execute the predictive model using your grade spreadsheets to generate a warning risk report.
                  </p>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                    <User className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-[10px] text-slate-500 font-bold">Advisor Execution Needed</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Graduation Audit tab */}
      {activeSubTab === "graduation" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Graduation Degree Audit</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Automated eligibility verification against ATTC curriculum guidelines.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onViewDoc("transcript")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-900"
              >
                <FileText className="w-4 h-4" />
                <span>Official Transcript</span>
              </button>
              {student.status === "Graduated" && (
                <button
                  onClick={() => onViewDoc("diploma")}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Award className="w-4 h-4" />
                  <span>Issue Temporary Diploma</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                Degree Checklist Audits
              </h4>

              <div className="space-y-2.5">
                {/* Rule 1: Credit Hours */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Total Credit Hours Completed</span>
                    <p className="text-[10px] text-slate-400 font-medium">Requires minimum 120 credit hours for CS/IT.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {student.creditHoursCompleted} / 120 CH
                    </span>
                    {student.creditHoursCompleted >= 120 ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        PASSED
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        INCOMPLETE
                      </span>
                    )}
                  </div>
                </div>

                {/* Rule 2: CGPA */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Cumulative GPA (CGPA) Audit</span>
                    <p className="text-[10px] text-slate-400 font-medium">Requires minimum cumulative GPA of 2.00.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-850">
                      {student.cgpa.toFixed(2)} / 2.00
                    </span>
                    {student.cgpa >= 2.0 ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        PASSED
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        FAILED
                      </span>
                    )}
                  </div>
                </div>

                {/* Rule 3: Behavioral Clearance */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">Behavioral and Disciplinary Clearance</span>
                    <p className="text-[10px] text-slate-400 font-medium">Must not be currently suspended or undergoing investigation.</p>
                  </div>
                  <div>
                    {student.status !== "Suspended" ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        CLEARED
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                        BLOCKED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Final status badge card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3">
              <Award className={`w-12 h-12 ${student.status === "Graduated" ? "text-amber-500 animate-bounce" : "text-slate-400"}`} />
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                Graduation Status
              </h4>
              <div className="text-sm font-bold text-slate-800">
                {student.status === "Graduated" ? (
                  <span className="text-amber-600 flex items-center gap-1.5 justify-center font-bold">
                    🎓 CONFERRED GRADUATE
                  </span>
                ) : (
                  <span className="text-slate-500 font-bold">UNDERGRADUATE / MONITORING</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 max-w-xs font-medium leading-relaxed">
                {student.status === "Graduated" 
                  ? "Congratulations! Your degree has been conferred. You can generate and print your official certificate." 
                  : "Complete your remaining credits and clear grades with the Graduation Officer."}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
