import fs from "fs";
import path from "path";

// Define TypeScript interfaces for our SIMS database
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  faceEnrolled: boolean;
  faceData?: string; // base64 face snapshot for simulation
}

export interface Student {
  userId: string;
  id: string; // e.g. ATTC-2026-001
  name: string;
  email: string;
  department: string;
  program: string;
  semester: string; // e.g. "Year 1 Semester 1", "Year 2 Semester 2"
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
  continuousAssessment: number; // Max 60
  finalExam: number; // Max 40
  total: number; // Max 100
  letterGrade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D, F
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
  aiInsights?: string; // Summarized performance prediction by Gemini
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
  awardMedal: string; // e.g. "Dean's Gold Medal" or "None"
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

const DB_FILE_PATH = path.join(process.cwd(), "data", "sims_db.json");

// Ensure data directory exists
function ensureDataDirectory() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initial Mock Data
const INITIAL_DB: DBStructure = {
  users: [
    { id: "SYS-001", name: "Dejene Dagnu", email: "dejenedagnu696@gmail.com", role: "System Administrator", faceEnrolled: true },
    { id: "STUD-001", name: "Abebe Kebede", email: "abebe@attc.edu.et", role: "Student", faceEnrolled: false },
    { id: "STUD-002", name: "Betty Hailu", email: "betty@attc.edu.et", role: "Student", faceEnrolled: false },
    { id: "STUD-003", name: "Yared Tesfaye", email: "yared@attc.edu.et", role: "Student", faceEnrolled: false },
    { id: "INST-001", name: "Dr. Solomon Tadesse", email: "solomon@attc.edu.et", role: "Instructor", faceEnrolled: true },
    { id: "INST-002", name: "Wzo. Kidist Belay", email: "kidist@attc.edu.et", role: "Instructor", faceEnrolled: false },
    { id: "ADV-001", name: "Wzo. Almaz Negash", email: "almaz@attc.edu.et", role: "Academic Advisor", faceEnrolled: true },
    { id: "DEPT-001", name: "Dr. Elias Yosef", email: "elias@attc.edu.et", role: "Department Head", faceEnrolled: true },
    { id: "REG-001", name: "Selam Tesfaye", email: "selam@attc.edu.et", role: "Registrar Staff", faceEnrolled: false },
    { id: "REG-HEAD", name: "Ato Kassahun Belay", email: "kassahun@attc.edu.et", role: "Registrar Head", faceEnrolled: true },
    { id: "COMM-001", name: "Prof. Tsegaye Ararso", email: "tsegaye@attc.edu.et", role: "Approval Committee", faceEnrolled: true },
    { id: "DISC-001", name: "Commander Daniel Assefa", email: "daniel@attc.edu.et", role: "Discipline Officer", faceEnrolled: false },
    { id: "GRAD-001", name: "Wzo. Tigist Mulugeta", email: "tigist@attc.edu.et", role: "Graduation Officer", faceEnrolled: false },
    { id: "ADMIN-001", name: "Dean Haile Selassie", email: "haile@attc.edu.et", role: "College Administration", faceEnrolled: true }
  ],
  students: [
    {
      userId: "STUD-001",
      id: "ATTC-2026-001",
      name: "Abebe Kebede",
      email: "abebe@attc.edu.et",
      department: "Information Technology",
      program: "B.Sc. in Computer Science & IT",
      semester: "Year 3 Semester 2",
      status: "Active",
      advisorId: "ADV-001",
      cgpa: 3.82,
      gpa: 3.90,
      creditHoursCompleted: 94
    },
    {
      userId: "STUD-002",
      id: "ATTC-2026-002",
      name: "Betty Hailu",
      email: "betty@attc.edu.et",
      department: "Agro-Processing",
      program: "B.Sc. in Food Engineering",
      semester: "Year 3 Semester 2",
      status: "Warning",
      advisorId: "ADV-001",
      cgpa: 1.95,
      gpa: 1.80,
      creditHoursCompleted: 88
    },
    {
      userId: "STUD-003",
      id: "ATTC-2026-003",
      name: "Yared Tesfaye",
      email: "yared@attc.edu.et",
      department: "Agriculture",
      program: "B.Sc. in Sustainable Agriculture",
      semester: "Year 4 Semester 2",
      status: "Active",
      advisorId: "ADV-001",
      cgpa: 3.95,
      gpa: 4.00,
      creditHoursCompleted: 120
    }
  ],
  programs: [
    { id: "PROG-CSIT", name: "B.Sc. in Computer Science & IT", department: "Information Technology", totalCreditsRequired: 120 },
    { id: "PROG-FE", name: "B.Sc. in Food Engineering", department: "Agro-Processing", totalCreditsRequired: 132 },
    { id: "PROG-SA", name: "B.Sc. in Sustainable Agriculture", department: "Agriculture", totalCreditsRequired: 124 }
  ],
  courses: [
    { code: "CS-302", name: "Advanced Web Technologies", department: "Information Technology", credits: 3, prerequisites: ["CS-201"] },
    { code: "CS-304", name: "Database Systems", department: "Information Technology", credits: 4, prerequisites: ["CS-201"] },
    { code: "CS-306", name: "Software Engineering", department: "Information Technology", credits: 3, prerequisites: [] },
    { code: "AP-311", name: "Food Chemistry", department: "Agro-Processing", credits: 4, prerequisites: ["CHEM-101"] },
    { code: "AP-312", name: "Post-Harvest Technology", department: "Agro-Processing", credits: 3, prerequisites: [] },
    { code: "AG-401", name: "Organic Farming Practices", department: "Agriculture", credits: 3, prerequisites: [] },
    { code: "AG-402", name: "Soil Science & Management", department: "Agriculture", credits: 4, prerequisites: [] }
  ],
  registrations: [
    { id: "REG-001", studentId: "ATTC-2026-001", courseCode: "CS-302", semester: "Year 3 Semester 2", status: "Approved", date: "2026-06-15" },
    { id: "REG-002", studentId: "ATTC-2026-001", courseCode: "CS-304", semester: "Year 3 Semester 2", status: "Approved", date: "2026-06-15" },
    { id: "REG-003", studentId: "ATTC-2026-002", courseCode: "AP-311", semester: "Year 3 Semester 2", status: "Pending_Advisor", date: "2026-06-18" },
    { id: "REG-004", studentId: "ATTC-2026-002", courseCode: "AP-312", semester: "Year 3 Semester 2", status: "Pending_Advisor", date: "2026-06-18" },
    { id: "REG-005", studentId: "ATTC-2026-003", courseCode: "AG-401", semester: "Year 4 Semester 2", status: "Approved", date: "2026-06-10" }
  ],
  grades: [
    {
      id: "GR-001",
      studentId: "ATTC-2026-001",
      courseCode: "CS-302",
      semester: "Year 3 Semester 2",
      continuousAssessment: 54,
      finalExam: 36,
      total: 90,
      letterGrade: "A",
      status: "Submitted_Dept",
      instructorId: "INST-001",
      history: [
        { status: "Draft", actorName: "Dr. Solomon Tadesse", actorRole: "Instructor", timestamp: "2026-06-20T10:00:00Z" },
        { status: "Submitted_Dept", actorName: "Dr. Solomon Tadesse", actorRole: "Instructor", timestamp: "2026-06-22T14:30:00Z", remarks: "Final exam grades submitted." }
      ]
    },
    {
      id: "GR-002",
      studentId: "ATTC-2026-002",
      courseCode: "AP-311",
      semester: "Year 3 Semester 1",
      continuousAssessment: 35,
      finalExam: 20,
      total: 55,
      letterGrade: "C-",
      status: "Finalized",
      instructorId: "INST-002",
      history: [
        { status: "Draft", actorName: "Wzo. Kidist Belay", actorRole: "Instructor", timestamp: "2026-01-10T09:00:00Z" },
        { status: "Finalized", actorName: "Ato Kassahun Belay", actorRole: "Registrar Head", timestamp: "2026-01-25T11:00:00Z" }
      ]
    },
    {
      id: "GR-003",
      studentId: "ATTC-2026-003",
      courseCode: "AG-401",
      semester: "Year 4 Semester 2",
      continuousAssessment: 58,
      finalExam: 39,
      total: 97,
      letterGrade: "A+",
      status: "Approved_Committee",
      instructorId: "INST-002",
      history: [
        { status: "Submitted_Dept", actorName: "Wzo. Kidist Belay", actorRole: "Instructor", timestamp: "2026-06-24T09:15:00Z" },
        { status: "Approved_Dept", actorName: "Dr. Elias Yosef", actorRole: "Department Head", timestamp: "2026-06-25T14:20:00Z", remarks: "Approved departmental grades." },
        { status: "Approved_Committee", actorName: "Prof. Tsegaye Ararso", actorRole: "Approval Committee", timestamp: "2026-06-26T16:00:00Z", remarks: "Commended outstanding score." }
      ]
    }
  ],
  advisingSessions: [
    {
      id: "ADV-S-001",
      advisorId: "ADV-001",
      studentId: "ATTC-2026-002",
      date: "2026-06-20",
      notes: "Betty is struggling with Food Chemistry (AP-311). She is experiencing personal challenges that affect her concentration.",
      recommendation: "Attend weekly tutoring. Meet with the course instructor Kidist Belay during office hours.",
      interventionPlan: "Provide dynamic learning check-ins. Reduce extracurricular loading. Register for at most 12 credits next semester.",
      aiInsights: "Betty is currently at high academic risk. Her GPA is 1.80, and her CGPA is 1.95 (Warning state). Standard prediction models suggest a 65% probability of academic probation unless she improves AP-311 by at least one full letter grade. Targeted tutoring and weekly check-ins are recommended to mitigate risk."
    }
  ],
  appeals: [
    {
      id: "APP-001",
      studentId: "ATTC-2026-002",
      courseCode: "AP-311",
      originalGrade: "C-",
      originalTotal: 55,
      reason: "I believe my final exam script was marked too strictly on question 4. I would like a re-marking of my script.",
      status: "Pending",
      date: "2026-06-28"
    }
  ],
  disciplineCases: [
    {
      id: "DISC-001",
      studentId: "ATTC-2026-002",
      violation: "Plagiarism in Assignment 2",
      date: "2026-05-14",
      description: "Copied advanced lab report sections directly from internet sources without proper citation.",
      warningLevel: "Verbal",
      penalty: "Zero on Assignment 2 (10% of continuous assessment). Verbal warnings issued and recorded.",
      status: "Resolved",
      officerId: "DISC-001"
    }
  ],
  graduationRecords: [
    {
      id: "GRAD-001",
      studentId: "ATTC-2026-003",
      programId: "B.Sc. in Sustainable Agriculture",
      gpa: 4.00,
      cgpa: 3.95,
      eligible: true,
      classification: "First Class with Great Distinction",
      awardMedal: "Dean's Gold Medal",
      clearanceStatus: "Cleared",
      approvedBy: "Wzo. Tigist Mulugeta",
      approvedDate: "2026-07-01"
    }
  ],
  auditLogs: [
    {
      id: "LOG-001",
      userId: "SYS-001",
      userName: "Dejene Dagnu",
      userRole: "System Administrator",
      action: "System Initialization",
      details: "SIMS local persistent database initialized successfully.",
      timestamp: "2026-07-07T02:53:08Z"
    }
  ]
};

// Helper: Read database from file
export function readDB(): DBStructure {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  
  // Write default DB if file doesn't exist
  writeDB(INITIAL_DB);
  return INITIAL_DB;
}

// Helper: Write database to file
export function writeDB(db: DBStructure) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// Helper: Add audit log
export function addLog(userId: string, userName: string, userRole: string, action: string, details: string) {
  const db = readDB();
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog); // Put new logs at the beginning
  writeDB(db);
}
