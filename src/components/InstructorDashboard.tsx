import React, { useState, useEffect } from "react";
import { BookOpen, Save, CheckSquare, Plus, AlertCircle, Sparkles, Database, CheckCircle2 } from "lucide-react";
import { User, Student, DBStructure, Course, Grade } from "../types";

interface InstructorDashboardProps {
  instructor: User;
  db: DBStructure;
  onSaveGrades: (gradesList: any[], courseCode: string, submitToDept: boolean) => Promise<void>;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  instructor,
  db,
  onSaveGrades,
}) => {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [spreadsheet, setSpreadsheet] = useState<any[]>([]);
  const [semester] = useState("Year 3 Semester 2");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionType, setActionType] = useState<"draft" | "submit">("draft");

  const instructorCourses = db.courses; // For simplicity in mock context, let them grade any course

  // Initialize spreadsheet when course selection changes
  useEffect(() => {
    if (!selectedCourse) {
      setSpreadsheet([]);
      return;
    }

    // Find students registered for this course code
    const registeredStudents = db.registrations
      .filter((r) => r.courseCode === selectedCourse && r.status === "Approved")
      .map((r) => db.students.find((s) => s.id === r.studentId))
      .filter(Boolean) as Student[];

    // Map existing grade entries, or construct empty draft placeholders
    const rows = registeredStudents.map((student) => {
      const existingGrade = db.grades.find(
        (g) => g.studentId === student.id && g.courseCode === selectedCourse && g.semester === semester
      );

      return {
        studentId: student.id,
        name: student.name,
        department: student.department,
        continuousAssessment: existingGrade ? existingGrade.continuousAssessment : 0,
        finalExam: existingGrade ? existingGrade.finalExam : 0,
        total: existingGrade ? existingGrade.total : 0,
        letterGrade: existingGrade ? existingGrade.letterGrade : "F",
        status: existingGrade ? existingGrade.status : "Draft"
      };
    });

    setSpreadsheet(rows);
  }, [selectedCourse, db, semester]);

  // Handle value modifications inside the spreadsheet grid
  const handleScoreChange = (studentId: string, field: "continuousAssessment" | "finalExam", value: string) => {
    setSaveSuccess(false);
    const numericVal = Math.max(0, Math.min(field === "continuousAssessment" ? 60 : 40, Number(value) || 0));

    setSpreadsheet((prev) =>
      prev.map((row) => {
        if (row.studentId === studentId) {
          const updatedRow = { ...row, [field]: numericVal };
          const ca = field === "continuousAssessment" ? numericVal : row.continuousAssessment;
          const fe = field === "finalExam" ? numericVal : row.finalExam;
          const total = ca + fe;

          // Compute letter grade dynamically
          let letter = "F";
          if (total >= 90) letter = "A+";
          else if (total >= 85) letter = "A";
          else if (total >= 80) letter = "A-";
          else if (total >= 75) letter = "B+";
          else if (total >= 70) letter = "B";
          else if (total >= 65) letter = "B-";
          else if (total >= 60) letter = "C+";
          else if (total >= 50) letter = "C";
          else if (total >= 45) letter = "C-";
          else if (total >= 40) letter = "D";

          return {
            ...updatedRow,
            total,
            letterGrade: letter
          };
        }
        return row;
      })
    );
  };

  // Submit spreadsheet scores to API
  const handleSubmitSpreadsheet = async (submitToDept: boolean) => {
    if (!selectedCourse || spreadsheet.length === 0) return;
    setIsSaving(true);
    setActionType(submitToDept ? "submit" : "draft");
    try {
      await onSaveGrades(spreadsheet, selectedCourse, submitToDept);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow Status tracking helpers
  const getCourseWorkflowStatus = () => {
    if (!selectedCourse) return "Idle";
    const sampleGrade = db.grades.find((g) => g.courseCode === selectedCourse && g.semester === semester);
    return sampleGrade ? sampleGrade.status : "Draft";
  };

  const statusVal = getCourseWorkflowStatus();

  // Workflow stages visual index
  const workflowStages = [
    { key: "Draft", label: "Draft Spreadsheet" },
    { key: "Submitted_Dept", label: "Department Head Review" },
    { key: "Approved_Dept", label: "Approval Committee" },
    { key: "Approved_Committee", label: "Registrar Head Audit" },
    { key: "Approved_Registrar", label: "Registrar Final Lock" },
    { key: "Finalized", label: "Final Grade Published" }
  ];

  const currentStageIdx = workflowStages.findIndex((s) => s.key === statusVal);

  return (
    <div className="space-y-6">
      {/* Intro Dashboard info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Instructor Spreadsheet Assessment Console
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl font-medium">
          Enter continuous assessment (max 60%) and final exam (max 40%) scores for students enrolled in your assigned curriculum courses. 
          Saving as a draft keeps grades editable in your list. Submitting grades locks editing and starts the **5-Level institutional approval workflow** (Instructor → Dept Head → Committee → Registrar Head → Final Lock).
        </p>

        {/* Course selection dropdown */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Select Assigned Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Choose Course Catalog --</option>
              {instructorCourses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name} ({c.credits} Credits)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Active Semester
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-600 font-mono">
              {semester}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Active Enrollment Count
            </label>
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-800 font-bold font-mono">
              {selectedCourse ? `${spreadsheet.length} Enrolled Students` : "Select a course..."}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Stage Tracker Progress Bar */}
      {selectedCourse && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3.5">
            Gradebook Institutional Approval Pathway
          </h4>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 pointer-events-none" />
            <div 
              className="absolute top-4 left-4 h-0.5 bg-emerald-500 transition-all duration-500 pointer-events-none" 
              style={{ width: `${currentStageIdx >= 0 ? (currentStageIdx / (workflowStages.length - 1)) * 100 : 0}%` }}
            />

            <div className="relative flex justify-between">
              {workflowStages.map((stage, idx) => {
                const isPassed = idx <= currentStageIdx;
                const isActive = idx === currentStageIdx;
                return (
                  <div key={stage.key} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[10px] transition-all ${
                      isPassed ? "bg-emerald-600 border-emerald-500 text-white shadow-xs" :
                      "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[9px] mt-2 font-semibold max-w-[85px] text-center uppercase tracking-wide leading-tight ${
                      isActive ? "text-emerald-700 font-bold" : isPassed ? "text-slate-600 font-medium" : "text-slate-400"
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet grid */}
      {selectedCourse && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Grading Spreadsheet</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Course: {selectedCourse} • Double click / click on input boxes to edit values.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                disabled={isSaving || statusVal !== "Draft"}
                onClick={() => handleSubmitSpreadsheet(false)}
                className="bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft Spreadsheet</span>
              </button>
              <button
                disabled={isSaving || statusVal !== "Draft" || spreadsheet.length === 0}
                onClick={() => handleSubmitSpreadsheet(true)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Submit to Dept Head</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-3 w-32">Student ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center w-40">Continuous Assessment (Max 60)</th>
                  <th className="p-3 text-center w-40">Final Examination (Max 40)</th>
                  <th className="p-3 text-center w-28">Total Score (100)</th>
                  <th className="p-3 text-center w-28">Calculated Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans">
                {spreadsheet.length > 0 ? (
                  spreadsheet.map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-500">{row.studentId}</td>
                      <td className="p-3 text-slate-800 font-bold">{row.name}</td>
                      <td className="p-3 text-slate-500 text-[11px] font-medium">{row.department}</td>
                      
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          disabled={statusVal !== "Draft"}
                          value={row.continuousAssessment}
                          min={0}
                          max={60}
                          onChange={(e) => handleScoreChange(row.studentId, "continuousAssessment", e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center w-24 text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="number"
                          disabled={statusVal !== "Draft"}
                          value={row.finalExam}
                          min={0}
                          max={40}
                          onChange={(e) => handleScoreChange(row.studentId, "finalExam", e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center w-24 text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </td>

                      <td className="p-3 text-center font-bold font-mono text-slate-800">
                        {row.total} / 100
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 font-mono font-bold rounded text-xs text-center min-w-[45px] border ${
                          row.total >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          row.total >= 50 ? "bg-slate-100 text-slate-700 border-slate-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {row.letterGrade}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium italic">
                      No approved students are registered or offered under {selectedCourse} for Year 3 Semester 2. Check registration approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" /> Database state locks automatically on submission.
            </span>
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Grade sheet draft synchronized successfully!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grade Appeal monitoring panel */}
      {selectedCourse && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-xs text-slate-800 mb-3">Course Grade Appeal Logs</h4>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
            Monitor and track formal grade re-marking appeal submissions logged against this course code. Appeals are resolved at Committee levels.
          </p>

          <div className="divide-y divide-slate-150">
            {db.appeals.filter((a) => a.courseCode === selectedCourse).length > 0 ? (
              db.appeals.filter((a) => a.courseCode === selectedCourse).map((appeal) => (
                <div key={appeal.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-800">Student: {db.students.find((s) => s.id === appeal.studentId)?.name || appeal.studentId}</strong>
                    <div className="text-[10px] text-slate-500 italic mt-0.5">Reason: "{appeal.reason}"</div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase border font-bold ${
                      appeal.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {appeal.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic text-xs py-2 font-medium">
                No active appeals registered for this course grading block.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
