import React, { useState } from "react";
import { 
  Users, CheckCircle2, XCircle, FileText, AlertTriangle, MessageSquare, 
  Sparkles, Send, ShieldCheck, Scale, Award, BarChart3, Settings, Database, 
  Trash2, RefreshCw, CheckCircle, Search, HelpCircle, ArrowRight
} from "lucide-react";
import { 
  User, Student, DBStructure, Course, Registration, Grade, AdvisingSession, 
  Appeal, DisciplineCase, GraduationRecord, AuditLog 
} from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";

/* ==========================================================================
   1. ACADEMIC ADVISOR DASHBOARD
   ========================================================================== */
interface AdvisorDashboardProps {
  advisor: User;
  db: DBStructure;
  onApproveRegistration: (regIds: string[], status: "Approved" | "Rejected") => Promise<void>;
  onLogAdvisingSession: (studentId: string, notes: string, recommendation: string, intervention: string) => Promise<void>;
  onGenerateAiAdvice: (studentId: string) => Promise<void>;
}

export const AdvisorDashboard: React.FC<AdvisorDashboardProps> = ({
  advisor,
  db,
  onApproveRegistration,
  onLogAdvisingSession,
  onGenerateAiAdvice,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionRec, setSessionRec] = useState("");
  const [sessionIntervention, setSessionIntervention] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const assignedStudents = db.students; // For simplicity in mock context, display all students
  const pendingRegistrations = db.registrations.filter((r) => r.status === "Pending_Advisor");

  const handleApproveReg = async (studentId: string, approve: boolean) => {
    const studentRegs = pendingRegistrations.filter((r) => r.studentId === studentId).map((r) => r.id);
    if (studentRegs.length === 0) return;
    try {
      await onApproveRegistration(studentRegs, approve ? "Approved" : "Rejected");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !sessionNotes) return;
    try {
      await onLogAdvisingSession(selectedStudentId, sessionNotes, sessionRec, sessionIntervention);
      setSuccessMsg("Counselling session recorded on official transcript file.");
      setSessionNotes("");
      setSessionRec("");
      setSessionIntervention("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerAiAdvice = async (studentId: string) => {
    setIsAiLoading(true);
    try {
      await onGenerateAiAdvice(studentId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Pending registrations queue */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-emerald-600" />
            Registration Approval Desk
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
            Students submit course selection registrations that require academic advisor evaluation to ensure prerequisites and credit loads comply with program structures.
          </p>

          <div className="space-y-4">
            {(Array.from(new Set(pendingRegistrations.map((r) => r.studentId))) as string[]).length > 0 ? (
              (Array.from(new Set(pendingRegistrations.map((r) => r.studentId))) as string[]).map((studId) => {
                const studentObj = db.students.find((s) => s.id === studId);
                const regs = pendingRegistrations.filter((r) => r.studentId === studId);
                const totalCredits = regs.reduce((sum, r) => sum + (db.courses.find((c) => c.code === r.courseCode)?.credits || 3), 0);

                return (
                  <div key={studId} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800">{studentObj?.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-2">({studId}) • CGPA: {studentObj?.cgpa.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        Selected: {totalCredits} Credits
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 py-1">
                      {regs.map((r) => (
                        <span key={r.id} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                          {r.courseCode} ({db.courses.find((c) => c.code === r.courseCode)?.credits || 3}cr)
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => handleApproveReg(studId, false)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Reject Selected
                      </button>
                      <button
                        onClick={() => handleApproveReg(studId, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1 rounded text-[10px] font-bold transition cursor-pointer shadow-sm"
                      >
                        Approve Registration
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl font-medium">
                No course registrations pending academic advising review in this semester.
              </div>
            )}
          </div>
        </div>

        {/* Counselling Session formulation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Record Advising Counseling Notes
          </h3>

          <form onSubmit={handleSaveSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                  Target Student File
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student --</option>
                  {assignedStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {selectedStudentId && (
                  <button
                    type="button"
                    onClick={() => handleTriggerAiAdvice(selectedStudentId)}
                    disabled={isAiLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Auditing performance...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Execute Gemini AI Performance Advisor</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                  Counseling Notes
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  required
                  rows={4}
                  placeholder="Record qualitative student counseling notes. (e.g. personal struggles, academic focus check...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                  Academic Recommendations
                </label>
                <textarea
                  value={sessionRec}
                  onChange={(e) => setSessionRec(e.target.value)}
                  rows={4}
                  placeholder="Tutoring paths, office hours recommendations, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                AIP (Academic Intervention Plan)
              </label>
              <input
                type="text"
                value={sessionIntervention}
                onChange={(e) => setSessionIntervention(e.target.value)}
                placeholder="Specific remediation directives if student is on Warning/Probation."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedStudentId || !sessionNotes}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg font-bold text-xs transition cursor-pointer border border-slate-900"
            >
              Log Advising Record File
            </button>
          </form>
        </div>
      </div>

      {/* Advisor sidebar monitor */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">Academic Risk Monitor</h3>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
            Immediate check list of assigned student cohort CGPAs. Warning state accounts require monthly academic advising logs.
          </p>

          <div className="space-y-2">
            {assignedStudents.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setSelectedStudentId(s.id)}
                className={`p-3 rounded-xl border transition text-xs flex items-center justify-between cursor-pointer ${
                  selectedStudentId === s.id ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {s.id} • CGPA: {s.cgpa.toFixed(2)}</div>
                </div>
                <div>
                  {s.status === "Active" ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-bold font-mono">ACTIVE</span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold font-mono">WARNING</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedStudentId && db.advisingSessions.find((as) => as.studentId === selectedStudentId && as.aiInsights) && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-600 mb-2 border-b border-slate-100 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Gemini Advisory Profile</span>
            </div>
            <h4 className="font-bold text-xs text-slate-800 mb-2">AI Performance Projection</h4>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10px] text-slate-700 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-line font-mono font-medium">
              {db.advisingSessions.find((as) => as.studentId === selectedStudentId && as.aiInsights)?.aiInsights}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};


/* ==========================================================================
   2. GRADE APPROVAL WORKFLOW DASHBOARD (Dept Head, Committee, Registrar Head)
   ========================================================================== */
interface GradeApprovalDashboardProps {
  role: "Department Head" | "Approval Committee" | "Registrar Head";
  db: DBStructure;
  user: User;
  onApproveGrades: (gradeIds: string[], nextStatus: Grade["status"], remarks: string) => Promise<void>;
}

export const GradeApprovalDashboard: React.FC<GradeApprovalDashboardProps> = ({
  role,
  db,
  user,
  onApproveGrades,
}) => {
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  // Determine which status levels we query depending on role
  // Instructor -> Submitted_Dept -> Approved_Dept -> Approved_Committee -> Approved_Registrar -> Finalized
  const getRequiredInputStatus = () => {
    if (role === "Department Head") return "Submitted_Dept";
    if (role === "Approval Committee") return "Approved_Dept";
    return "Approved_Committee"; // Registrar Head
  };

  const getTargetOutputStatus = () => {
    if (role === "Department Head") return "Approved_Dept";
    if (role === "Approval Committee") return "Approved_Committee";
    return "Finalized"; // Registrar Head locks and finalizes grades
  };

  const inputStatus = getRequiredInputStatus();
  const outputStatus = getTargetOutputStatus();

  // Find unique courses that have grades in the inputStatus
  const pendingGrades = db.grades.filter((g) => g.status === inputStatus);
  const pendingCourses = Array.from(new Set(pendingGrades.map((g) => g.courseCode)));

  const handleApproveAllInCourse = async () => {
    if (!selectedCourse) return;
    const targetGradeIds = pendingGrades.filter((g) => g.courseCode === selectedCourse).map((g) => g.id);
    if (targetGradeIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onApproveGrades(targetGradeIds, outputStatus, remarks);
      setRemarks("");
      setSelectedCourse("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Institutional Grade Verification Panel - ({role})
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Review curriculum grade submissions. Enforce academic regulations and transition course rosters to the next level of validation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Course queue picker */}
        <div className="space-y-3">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
            Pending Course Gradebooks
          </h4>
          
          <div className="space-y-1.5">
            {pendingCourses.length > 0 ? (
              pendingCourses.map((code) => {
                const count = pendingGrades.filter((g) => g.courseCode === code).length;
                return (
                  <button
                    key={code}
                    onClick={() => setSelectedCourse(code)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between font-mono transition border cursor-pointer ${
                      selectedCourse === code ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700 font-medium"
                    }`}
                  >
                    <span>{code} - {db.courses.find((c) => c.code === code)?.name}</span>
                    <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {count} Records
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium italic text-xs border border-dashed border-slate-200 rounded-xl">
                No course grade books currently require your level of workflow approval.
              </div>
            )}
          </div>
        </div>

        {/* Grade Sheets audit grid */}
        <div className="md:col-span-2 space-y-4">
          {selectedCourse ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100/40 text-[11px] flex justify-between font-mono text-slate-500 font-bold">
                  <span>Auditing course: {selectedCourse}</span>
                  <span>Semester: Year 3 Semester 2</span>
                </div>
                
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-[9px] uppercase font-bold border-b border-slate-200">
                      <th className="p-2">Student ID</th>
                      <th className="p-2">Full Name</th>
                      <th className="p-2 text-center">CA (60)</th>
                      <th className="p-2 text-center">Exam (40)</th>
                      <th className="p-2 text-center">Total</th>
                      <th className="p-2 text-center">Letter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingGrades.filter((g) => g.courseCode === selectedCourse).map((g) => (
                      <tr key={g.id} className="border-b border-slate-150">
                        <td className="p-2 font-mono text-slate-500">{g.studentId}</td>
                        <td className="p-2 text-slate-800 font-medium">{db.students.find((s) => s.id === g.studentId)?.name || g.studentId}</td>
                        <td className="p-2 text-center text-slate-500 font-mono">{g.continuousAssessment}</td>
                        <td className="p-2 text-center text-slate-500 font-mono">{g.finalExam}</td>
                        <td className="p-2 text-center text-slate-700 font-mono font-bold">{g.total}</td>
                        <td className="p-2 text-center font-bold text-emerald-700 font-mono">{g.letterGrade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Approval workflow notes form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  Record Verification Remarks
                </h4>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide audit remarks or approval comments. (e.g. verified compliant with grading curves...)"
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={handleApproveAllInCourse}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>Approve to next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400 font-medium">
              <Database className="w-8 h-8 mb-2 text-slate-300" />
              <span>Select a pending course grade book from the left panel to begin verification audits.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};


/* ==========================================================================
   3. REGISTRAR STAFF DASHBOARD
   ========================================================================== */
interface RegistrarStaffDashboardProps {
  db: DBStructure;
  onViewDoc: (studentId: string, type: "transcript" | "diploma") => void;
}

export const RegistrarStaffDashboard: React.FC<RegistrarStaffDashboardProps> = ({
  db,
  onViewDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredStudents = db.students.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <Settings className="w-5 h-5 text-emerald-600" />
          Registrar Services Desk
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Generate watermarked official transcripts, verify degree requirements, and issue temporary certificates of graduation.
        </p>
      </div>

      <div className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-450 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student registry by Name or ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3">Student ID</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Department</th>
              <th className="p-3 font-mono">CGPA</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 font-sans">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-100/50">
                <td className="p-3 font-mono font-bold text-slate-500">{student.id}</td>
                <td className="p-3 font-bold text-slate-800">{student.name}</td>
                <td className="p-3 text-slate-500">{student.department}</td>
                <td className="p-3 font-mono text-emerald-600 font-bold">{student.cgpa.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${
                    student.status === "Graduated" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onViewDoc(student.id, "transcript")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Official Transcript</span>
                  </button>
                  {student.status === "Graduated" && (
                    <button
                      onClick={() => onViewDoc(student.id, "diploma")}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Issue Certificate</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


/* ==========================================================================
   4. DISCIPLINE OFFICER DASHBOARD
   ========================================================================== */
interface DisciplineDashboardProps {
  db: DBStructure;
  user: User;
  onFileDisciplinaryCase: (studentId: string, violation: string, description: string, warningLevel: string, penalty: string) => Promise<void>;
  onResolveDisciplineCase: (caseId: string, status: "Resolved", penalty: string) => Promise<void>;
}

export const DisciplineDashboard: React.FC<DisciplineDashboardProps> = ({
  db,
  user,
  onFileDisciplinaryCase,
  onResolveDisciplineCase,
}) => {
  const [studentId, setStudentId] = useState("");
  const [violation, setViolation] = useState("");
  const [description, setDescription] = useState("");
  const [warningLevel, setWarningLevel] = useState("Verbal");
  const [penalty, setPenalty] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegisterIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !violation || !description) return;
    try {
      await onFileDisciplinaryCase(studentId, violation, description, warningLevel, penalty);
      setSuccess(true);
      setStudentId("");
      setViolation("");
      setDescription("");
      setPenalty("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (caseId: string, updatedPenalty: string) => {
    try {
      await onResolveDisciplineCase(caseId, "Resolved", updatedPenalty);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* File Case form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-1 h-max">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
          <Scale className="w-5 h-5 text-rose-600" />
          File Disciplinary Incident
        </h3>
        
        <form onSubmit={handleRegisterIncident} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Select Student ID
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            >
              <option value="">-- Choose Student --</option>
              {db.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Specific Infraction Type
            </label>
            <input
              type="text"
              value={violation}
              onChange={(e) => setViolation(e.target.value)}
              required
              placeholder="e.g. Plagiarism in Exam, Lab sabotage..."
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Warning Severity Level
            </label>
            <select
              value={warningLevel}
              onChange={(e) => setWarningLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            >
              <option value="Verbal">Verbal Warning</option>
              <option value="Written">Written Warning</option>
              <option value="Suspended">Institutional Suspension</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Details / Narrative
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Record detailed objective evidence logs..."
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Immediate Penalty applied
            </label>
            <input
              type="text"
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              placeholder="Zero on course assignment, campus suspension..."
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {success && (
            <div className="bg-rose-50 border border-rose-200 p-2 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-rose-600" />
              <span>Incident registered on official log.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs cursor-pointer transition shadow-sm"
          >
            Log Disciplinary Charge
          </button>
        </form>
      </div>

      {/* Incident Case Lists */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">Academic Integrity Log</h3>
          
          <div className="space-y-3">
            {db.disciplineCases.length > 0 ? (
              db.disciplineCases.map((c) => (
                <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2 text-xs">
                    <div>
                      <strong className="text-slate-800">Student: {db.students.find((s) => s.id === c.studentId)?.name || c.studentId}</strong>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">({c.studentId})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold font-mono tracking-wider ${
                      c.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 font-mono"><strong className="text-rose-600 font-bold">Violation:</strong> {c.violation}</p>
                  <p className="text-[11px] text-slate-600 font-medium italic">" {c.description} "</p>
                  
                  <div className="text-[10px] text-slate-500 flex justify-between pt-1.5 border-t border-slate-200/60">
                    <span>Warning: <strong className="text-slate-700 font-bold">{c.warningLevel}</strong></span>
                    <span>Penalty: <span className="text-slate-700 font-bold italic">{c.penalty}</span></span>
                  </div>

                  {c.status === "Pending" && (
                    <div className="flex justify-end pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleResolve(c.id, c.penalty)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition cursor-pointer shadow-sm"
                      >
                        Resolve Case File
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl text-xs">
                Perfect records on database. No disciplinary warning logs registered.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};


/* ==========================================================================
   5. GRADUATION OFFICER DASHBOARD
   ========================================================================== */
interface GraduationOfficerDashboardProps {
  db: DBStructure;
  user: User;
  onAuditGraduation: (studentId: string, clearAcademic: boolean, awardMedal: string) => Promise<void>;
}

export const GraduationOfficerDashboard: React.FC<GraduationOfficerDashboardProps> = ({
  db,
  user,
  onAuditGraduation,
}) => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [awardMedal, setAwardMedal] = useState("None");
  const [clearAcademic, setClearAcademic] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter 4th year / final semester students to audit
  const auditCohort = db.students; // Let's audit all students for flexible demo!

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsProcessing(true);
    try {
      await onAuditGraduation(selectedStudent, clearAcademic, awardMedal);
      setAwardMedal("None");
      setSelectedStudent("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Audit Checklist form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-1 h-max">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
          <Award className="w-5 h-5 text-emerald-600" />
          Confer Degree & Clear File
        </h3>

        <form onSubmit={handleAudit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Audited Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Choose Candidate --</option>
              {auditCohort.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.name} ({s.creditHoursCompleted} CH completed)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Honors Medal/Award Determination
            </label>
            <select
              value={awardMedal}
              onChange={(e) => setAwardMedal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="None">None</option>
              <option value="Dean's Gold Medal">Dean's Gold Medal (Outstanding Merit)</option>
              <option value="Best Agro Innovator Award">Best Agro Innovator Award</option>
            </select>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="clear"
              checked={clearAcademic}
              onChange={(e) => setClearAcademic(e.target.checked)}
              className="text-emerald-600 focus:ring-emerald-500 bg-white border-slate-200 rounded"
            />
            <label htmlFor="clear" className="text-xs text-slate-700 font-bold">
              Grant formal Registrar clearance
            </label>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !selectedStudent}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Complete Degree Audit
          </button>
        </form>
      </div>

      {/* Graduation Candidates cohort lists */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">Conferred Graduates Register</h3>
          
          <div className="space-y-3">
            {db.graduationRecords.length > 0 ? (
              db.graduationRecords.map((rec) => {
                const student = db.students.find((s) => s.id === rec.studentId);
                return (
                  <div key={rec.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-800 font-bold">Graduate: {student?.name}</strong>
                      <div className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">
                        ID: {rec.studentId} • Cumulative GPA: {rec.cgpa.toFixed(2)} • Medals: {rec.awardMedal}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1 uppercase tracking-wide">
                        Classification: {rec.classification}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold font-mono tracking-wider ${
                        rec.clearanceStatus === "Cleared" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {rec.clearanceStatus === "Cleared" ? "Conferred & Cleared" : "Clearance Pending"}
                      </span>
                      <div className="text-[9px] text-slate-400 font-mono font-bold mt-1">Conferred: {rec.approvedDate}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl text-xs">
                No graduation degree audits completed yet. Conduct an audit above to confer student degrees.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};


/* ==========================================================================
   6. COLLEGE ADMINISTRATION EXECUTIVE ANALYTICS
   ========================================================================== */
export const ExecutiveAnalyticsDashboard: React.FC<{ db: DBStructure }> = ({ db }) => {
  
  // 1. Chart Data: Enrollment by Department
  const depts = Array.from(new Set(db.students.map((s) => s.department)));
  const enrollmentData = depts.map((d) => ({
    name: d,
    count: db.students.filter((s) => s.department === d).length,
    averageCGPA: parseFloat((db.students.filter((s) => s.department === d).reduce((sum, s) => sum + s.cgpa, 0) / db.students.filter((s) => s.department === d).length).toFixed(2))
  }));

  // 2. Chart Data: Grading Letter Distribution
  const letters = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
  const gradeDistribution = letters.map((letter) => ({
    name: letter,
    count: db.grades.filter((g) => g.letterGrade === letter).length
  }));

  // Colors for Recharts pie cells
  const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#3b82f6", "#60a5fa", "#a7f3d0", "#f59e0b", "#fbbf24", "#fef3c7", "#ef4444", "#f87171"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Enrolment Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
            Enrollment and Academic Metrics by Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }} />
                <Legend fontSize={10} />
                <Bar dataKey="count" fill="#10b981" name="Student Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Line chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
            Cohorts Grade Sheet Distribution Curves
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} name="Total Grade Frequency" dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Aggregate Institutional Stats KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div className="text-center sm:text-left">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ATTC Aggregate CGPA</div>
          <div className="text-3xl font-mono font-bold text-slate-800 mt-1">
            {(db.students.reduce((sum, s) => sum + s.cgpa, 0) / db.students.length).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Institutional Good Standing average</span>
        </div>
        <div className="text-center sm:text-left border-y sm:border-y-0 sm:border-x border-slate-200 py-4 sm:py-0 sm:px-6">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Graduation Rate</div>
          <div className="text-3xl font-mono font-bold text-emerald-650 mt-1">
            {Math.round((db.students.filter((s) => s.status === "Graduated").length / db.students.length) * 100)}%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Conferred Degree completions</span>
        </div>
        <div className="text-center sm:text-left">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Warning/Probation Cap</div>
          <div className="text-3xl font-mono font-bold text-amber-600 mt-1">
            {db.students.filter((s) => s.status === "Warning").length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Students under Academic Intervention</span>
        </div>
      </div>
    </div>
  );
};


/* ==========================================================================
   7. SYSTEM ADMINISTRATOR DASHBOARD
   ========================================================================== */
interface SystemAdminDashboardProps {
  db: DBStructure;
  onResetDB: () => Promise<void>;
}

export const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({
  db,
  onResetDB,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const filteredLogs = db.auditLogs.filter(
    (l) => l.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReset = async () => {
    if (!window.confirm("Restore database to default initial demonstration state? All modified registrations, grade inputs, and advising logs will be refreshed.")) return;
    setIsResetting(true);
    try {
      await onResetDB();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Database control cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-1 h-max space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <Database className="w-5 h-5 text-emerald-600" />
          System Maintenance Panel
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Manage backend schemas, perform full backups, or reset persistent demonstration records.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
            Demonstration Tools
          </h4>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-400 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Reset Demo DB records</span>
          </button>
        </div>
      </div>

      {/* Searchable Audit logs */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">System Audit Logs</h3>
          
          <div className="mb-4 relative max-w-sm">
            <Search className="w-4 h-4 text-slate-450 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter audit trails by action or user name..."
              className="w-full bg-slate-50 border border-slate-200 rounded py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] font-mono space-y-1">
                <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-500 font-bold">
                  <span className="font-bold text-slate-700">{log.action}</span>
                  <span className="text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-700">Details: {log.details}</p>
                <div className="text-[10px] text-slate-400 font-bold">
                  Actor: <strong>{log.userName}</strong> ({log.userRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
