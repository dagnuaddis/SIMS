import React, { useState, useEffect } from "react";
import { 
  Users, LogOut, Lock, RefreshCw, AlertCircle, ShieldCheck, 
  CheckCircle2, Activity, Video, Sparkles 
} from "lucide-react";
import { User, Student, DBStructure, Course, Grade } from "./types";
import { BiometricLogin } from "./components/BiometricLogin";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { DocumentViewer } from "./components/DocumentViewer";

// Modular dashboards
import { StudentDashboard } from "./components/StudentDashboard";
import { InstructorDashboard } from "./components/InstructorDashboard";
import { 
  AdvisorDashboard, GradeApprovalDashboard, RegistrarStaffDashboard, 
  DisciplineDashboard, GraduationOfficerDashboard, ExecutiveAnalyticsDashboard, 
  SystemAdminDashboard 
} from "./components/AdminDashboards";

export default function App() {
  const [db, setDb] = useState<DBStructure | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Login fallback states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Student");
  const [loginError, setLoginError] = useState("");

  // Biometric state flags
  const [showBiometricLoginModal, setShowBiometricLoginModal] = useState(false);
  const [showBiometricEnrollModal, setShowBiometricEnrollModal] = useState(false);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState("");

  // Document viewer modal states
  const [viewDocStudentId, setViewDocStudentId] = useState<string | null>(null);
  const [viewDocType, setViewDocType] = useState<"transcript" | "diploma" | null>(null);

  // Fetch complete database state
  const fetchDbState = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDb(data.db || data);
      }
    } catch (err) {
      console.error("Error fetching ATTC database state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbState();
  }, []);

  // Post dynamic actions helper
  const postAction = async (endpoint: string, body: object) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actorId: currentUser?.id }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Action request failed.");
    }
    await fetchDbState();
  };

  // 1. Password/Credential Login Fallback
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          role: loginRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.student) setCurrentStudent(data.student);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        const errData = await res.json();
        setLoginError(errData.message || "Invalid authentication credentials.");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication gateway server.");
    }
  };

  // 2. Facial Biometric Login
  const handleBiometricLoginSubmit = async (snapshotBase64: string) => {
    setLoginError("");
    try {
      const res = await fetch("/api/auth/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceData: snapshotBase64 }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.student) setCurrentStudent(data.student);
        setShowBiometricLoginModal(false);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Facial signature does not match any registered student file.");
      }
    } catch (err: any) {
      throw new Error(err.message || "Facial authentication signature match failed.");
    }
  };

  // 3. Register webcam biometric enrollment
  const handleBiometricEnrollSubmit = async (snapshotBase64: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, faceData: snapshotBase64 }),
      });

      if (res.ok) {
        setEnrollSuccessMsg("Webcam face template enrolled successfully. You can now login using Face ID.");
        setShowBiometricEnrollModal(false);
        await fetchDbState();
        setTimeout(() => setEnrollSuccessMsg(""), 5000);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Facial scan quality audit failed.");
      }
    } catch (err: any) {
      throw new Error(err.message || "Facial enrollment failed.");
    }
  };

  // 4. Developer Instant Role Switching
  const handleDevRoleSwitch = async (userId: string) => {
    setLoading(true);
    try {
      // Find matching user in database state
      const targetUser = db?.users.find((u) => u.id === userId);
      if (targetUser) {
        setCurrentUser(targetUser);
        const matchingStudent = db?.students.find((s) => s.id === userId);
        setCurrentStudent(matchingStudent || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentStudent(null);
    setLoginError("");
  };

  // API wrappers mapping to backend endpoints
  const registerCourses = async (courseCodes: string[]) => {
    if (!currentStudent) return;
    await postAction("/api/register", { studentId: currentStudent.id, courseCodes });
  };

  const submitAppeal = async (courseCode: string, reason: string) => {
    if (!currentStudent) return;
    await postAction("/api/appeals/submit", { studentId: currentStudent.id, courseCode, reason });
  };

  const saveGrades = async (gradesList: any[], courseCode: string, submitToDept: boolean) => {
    await postAction("/api/grades/save", { courseCode, grades: gradesList, submitToDept });
  };

  const approveRegistration = async (regIds: string[], status: "Approved" | "Rejected") => {
    await postAction("/api/advisor/approve-registrations", { registrationIds: regIds, status });
  };

  const logAdvisingSession = async (studentId: string, notes: string, recommendation: string, interventionPlan: string) => {
    await postAction("/api/advisor/counseling", { studentId, notes, recommendation, interventionPlan });
  };

  const generateAiAdvice = async (studentId: string) => {
    await postAction("/api/advising/ai-predict", { studentId });
  };

  const approveGrades = async (gradeIds: string[], nextStatus: Grade["status"], remarks: string) => {
    await postAction("/api/grades/approve", { gradeIds, nextStatus, remarks });
  };

  const fileDisciplinaryCase = async (studentId: string, violation: string, description: string, warningLevel: string, penalty: string) => {
    await postAction("/api/discipline/log", { studentId, violation, description, warningLevel, penalty });
  };

  const resolveDisciplineCase = async (caseId: string, status: "Resolved", penalty: string) => {
    await postAction("/api/discipline/resolve", { caseId, status, penalty });
  };

  const auditGraduation = async (studentId: string, clearAcademic: boolean, awardMedal: string) => {
    await postAction("/api/graduation/audit", { studentId, clearAcademic, awardMedal });
  };

  const resetDB = async () => {
    await postAction("/api/db/reset", {});
  };

  if (loading || !db) {
    return (
      <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">
          Contacting ATTC SIMS Cloud Gateway...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col relative font-sans">
      
      {/* Dynamic Background Noise */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-slate-50 to-slate-50 pointer-events-none z-0" />

      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200/80 p-4 sticky top-0 z-40 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* ATTC Branding with typography */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold font-sans text-white text-sm shadow-[0_4px_12px_rgba(16,185,129,0.15)]">
              AT
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wide leading-none">
                Agro Technical & Technology College
              </h1>
              <p className="text-[10px] text-emerald-600 font-mono tracking-wider uppercase mt-1 leading-none">
                Student Information Management System (SIMS)
              </p>
            </div>
          </div>

          {/* User profile controls & session indicators */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-850 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[9px] font-semibold text-slate-500 font-mono flex items-center gap-1 justify-end mt-0.5">
                  <Activity className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                  <span>{currentUser.role}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-1.5">
                {/* Face biometric registration status */}
                {!currentUser.faceData ? (
                  <button
                    onClick={() => setShowBiometricEnrollModal(true)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enroll Face ID</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-700 px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Face ID Enrolled</span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-rose-50 hover:bg-rose-100/85 text-rose-600 border border-rose-200/50 px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Secured Academic Registry Gateway
            </div>
          )}

        </div>
      </header>

      {/* Enroll success message HUD */}
      {enrollSuccessMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 max-w-7xl mx-auto w-full mt-4 p-3 rounded-lg text-emerald-400 text-xs font-medium flex items-center gap-1.5 shrink-0 px-4">
          <Sparkles className="w-4 h-4 animate-bounce shrink-0" />
          <span>{enrollSuccessMsg}</span>
        </div>
      )}

      {/* MAIN BODY AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 z-10 relative">
        {currentUser ? (
          /* ================= COMPONENT PORTALS ROUTING ================= */
          <div className="space-y-6">
            
            {/* 1. Student Dashboard */}
            {currentUser.role === "Student" && currentStudent && (
              <StudentDashboard
                student={currentStudent}
                db={db}
                onRegisterCourses={registerCourses}
                onSubmitAppeal={submitAppeal}
                onViewDoc={(type) => {
                  setViewDocStudentId(currentStudent.id);
                  setViewDocType(type);
                }}
              />
            )}

            {/* 2. Instructor Dashboard */}
            {currentUser.role === "Instructor" && (
              <InstructorDashboard
                instructor={currentUser}
                db={db}
                onSaveGrades={saveGrades}
              />
            )}

            {/* 3. Academic Advisor */}
            {currentUser.role === "Academic Advisor" && (
              <AdvisorDashboard
                advisor={currentUser}
                db={db}
                onApproveRegistration={approveRegistration}
                onLogAdvisingSession={logAdvisingSession}
                onGenerateAiAdvice={generateAiAdvice}
              />
            )}

            {/* 4. Grade Verification Workflow Roles */}
            {(currentUser.role === "Department Head" || 
              currentUser.role === "Approval Committee" || 
              currentUser.role === "Registrar Head") && (
              <GradeApprovalDashboard
                role={currentUser.role}
                db={db}
                user={currentUser}
                onApproveGrades={approveGrades}
              />
            )}

            {/* 5. Registrar Staff */}
            {currentUser.role === "Registrar Staff" && (
              <RegistrarStaffDashboard
                db={db}
                onViewDoc={(studentId, type) => {
                  setViewDocStudentId(studentId);
                  setViewDocType(type);
                }}
              />
            )}

            {/* 6. Discipline Officer */}
            {currentUser.role === "Discipline Officer" && (
              <DisciplineDashboard
                db={db}
                user={currentUser}
                onFileDisciplinaryCase={fileDisciplinaryCase}
                onResolveDisciplineCase={resolveDisciplineCase}
              />
            )}

            {/* 7. Graduation Officer */}
            {currentUser.role === "Graduation Officer" && (
              <GraduationOfficerDashboard
                db={db}
                user={currentUser}
                onAuditGraduation={auditGraduation}
              />
            )}

            {/* 8. College Administration */}
            {currentUser.role === "College Administration" && (
              <ExecutiveAnalyticsDashboard db={db} />
            )}

            {/* 9. System Administrator */}
            {currentUser.role === "System Administrator" && (
              <SystemAdminDashboard
                db={db}
                onResetDB={resetDB}
              />
            )}

          </div>
        ) : (
          /* =================SECURE AUTHENTICATION CARD ================= */
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <Lock className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h2 className="text-lg font-bold font-display text-slate-900">ATTC Security Portal</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Authenticate to access institutional academic records.</p>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-700 text-xs flex items-start gap-1.5 font-medium mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{loginError}</p>
                </div>
              )}

              {/* Login Form with Fallback Options */}
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                    Security Authorization Level
                  </label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Student">Student Portal</option>
                    <option value="Instructor">Instructor Portal</option>
                    <option value="Academic Advisor">Academic Advisor</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Approval Committee">Approval Committee</option>
                    <option value="Registrar Staff">Registrar Staff</option>
                    <option value="Registrar Head">Registrar Head</option>
                    <option value="Discipline Officer">Discipline Officer</option>
                    <option value="Graduation Officer">Graduation Officer</option>
                    <option value="College Administration">College Administration</option>
                    <option value="System Administrator">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                    Credential Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. betty.hailu"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition shadow-sm cursor-pointer hover:shadow-md"
                  >
                    Sign In with Credentials
                  </button>
                </div>
              </form>

              {/* Biometric trigger Option */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowBiometricLoginModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Authenticate using Face ID (Webcam)</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* SYSTEM ROLE SWITCHER HUD OVERLAY (For quick testing/evaluation of all 11 roles) */}
      <div className="z-30 relative shrink-0">
        <RoleSwitcher users={db?.users || []} currentUser={currentUser} onSwitchUser={handleDevRoleSwitch} />
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider shrink-0 mt-auto">
        <span>© 2026 Agro Technical & Technology College • IT Division • Awassa, Ethiopia</span>
      </footer>

      {/* MODALS */}

      {/* 1. Biometric Login capture */}
      {showBiometricLoginModal && (
        <BiometricLogin
          mode="login"
          onSubmit={handleBiometricLoginSubmit}
          onClose={() => setShowBiometricLoginModal(false)}
        />
      )}

      {/* 2. Biometric Enroll capture */}
      {showBiometricEnrollModal && (
        <BiometricLogin
          mode="enroll"
          onSubmit={handleBiometricEnrollSubmit}
          onClose={() => setShowBiometricEnrollModal(false)}
        />
      )}

      {/* 3. Document Transcript/Diploma printed page */}
      {viewDocStudentId && viewDocType && db.students.find((s) => s.id === viewDocStudentId) && (
        <DocumentViewer
          student={db.students.find((s) => s.id === viewDocStudentId)!}
          db={db}
          docType={viewDocType}
          onClose={() => {
            setViewDocStudentId(null);
            setViewDocType(null);
          }}
        />
      )}

    </div>
  );
}
