export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  faceEnrolled: boolean;
  faceData?: string;
}

export interface Student {
  userId: string;
  id: string;
  name: string;
  email: string;
  department: string;
  program: string;
  semester: string;
  status: "Active" | "Warning" | "Probation" | "Suspended" | "Graduated";
  advisorId: string;
  cgpa: number;
  gpa: number;
  creditHoursCompleted: number;
  faceEnrollmentUrl?: string;
}

export interface Program {
  id: string;
  name: string;
  department: string;
  totalCreditsRequired: number;
}

export interface Course {
  code: string;
  name: string;
  department: string;
  credits: number;
  prerequisites: string[];
}

export interface Registration {
  id: string;
  studentId: string;
  courseCode: string;
  semester: string;
  status: "Draft" | "Pending_Advisor" | "Approved" | "Rejected" | "Add_Drop_Pending";
  advisorRemarks?: string;
  date: string;
}

export interface GradeHistory {
  status: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  remarks?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseCode: string;
  semester: string;
  continuousAssessment: number;
  finalExam: number;
  total: number;
  letterGrade: string;
  status: "Draft" | "Submitted_Dept" | "Approved_Dept" | "Approved_Committee" | "Approved_Registrar" | "Finalized";
  instructorId: string;
  history: GradeHistory[];
}

export interface AdvisingSession {
  id: string;
  advisorId: string;
  studentId: string;
  date: string;
  notes: string;
  recommendation: string;
  interventionPlan: string;
  aiInsights?: string;
}

export interface Appeal {
  id: string;
  studentId: string;
  courseCode: string;
  originalGrade: string;
  originalTotal: number;
  reason: string;
  status: "Pending" | "Under_Review" | "Resolved_Approved" | "Resolved_Rejected";
  resolverNotes?: string;
  newContinuousAssessment?: number;
  newFinalExam?: number;
  newTotal?: number;
  newLetterGrade?: string;
  resolvedDate?: string;
  date: string;
}

export interface DisciplineCase {
  id: string;
  studentId: string;
  violation: string;
  date: string;
  description: string;
  warningLevel: "None" | "Verbal" | "Written" | "Suspended" | "Expelled";
  penalty: string;
  status: "Pending" | "Investigating" | "Resolved";
  officerId: string;
}

export interface GraduationRecord {
  id: string;
  studentId: string;
  programId: string;
  gpa: number;
  cgpa: number;
  eligible: boolean;
  classification: "First Class with Great Distinction" | "First Class with Distinction" | "Great Distinction" | "Distinction" | "Pass" | "None";
  awardMedal: string;
  clearanceStatus: "Pending" | "Cleared";
  approvedBy?: string;
  approvedDate?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DBStructure {
  users: User[];
  students: Student[];
  programs: Program[];
  courses: Course[];
  registrations: Registration[];
  grades: Grade[];
  advisingSessions: AdvisingSession[];
  appeals: Appeal[];
  disciplineCases: DisciplineCase[];
  graduationRecords: GraduationRecord[];
  auditLogs: AuditLog[];
}
