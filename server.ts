import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { readDB, writeDB, addLog, DBStructure, Grade, Student, User, GraduationRecord } from "./server/database.js";

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit for base64 face snapshots
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Fetch entire database state (for easy, react-state sync)
  app.get("/api/db", (req, res) => {
    try {
      const db = readDB();
      res.json(db);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to read database state", details: err.message });
    }
  });

  // API Route: Reset database to initial state
  app.post("/api/db/reset", (req, res) => {
    try {
      const { actorId, actorName, actorRole } = req.body;
      // Writing an empty database will trigger the DB module to restore all default values on next read
      const emptyDB: any = null;
      writeDB(emptyDB);
      const restoredDB = readDB();
      
      addLog(
        actorId || "SYS-001",
        actorName || "System Administrator",
        actorRole || "System Administrator",
        "Database Reset",
        "Restored database to original demonstration mock data."
      );
      
      res.json({ success: true, db: restoredDB });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset database", details: err.message });
    }
  });

  // API Route: Auth / Login (Mock credentials verification)
  app.post("/api/auth/login", (req, res) => {
    try {
      const { userId } = req.body;
      const db = readDB();
      const user = db.users.find((u) => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found. Try STUD-001 or INST-001." });
      }

      const student = db.students.find((s) => s.userId === user.id);

      addLog(user.id, user.name, user.role, "User Login", "Logged into SIMS application portal.");
      res.json({ success: true, user, student });
    } catch (err: any) {
      res.status(500).json({ error: "Authentication failed", details: err.message });
    }
  });

  // API Route: Facial recognition simulation (Matching base64 images)
  app.post("/api/auth/facial-recognition", (req, res) => {
    try {
      const { base64Image, userId } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "No video frame snapshot provided." });
      }

      const db = readDB();
      
      // If a specific userId is requested to authenticate via face
      if (userId) {
        const user = db.users.find((u) => u.id === userId);
        if (!user) {
          return res.status(404).json({ error: "Requested user not found." });
        }
        if (!user.faceEnrolled) {
          return res.status(400).json({ error: "Facial template has not been registered for this account." });
        }
        
        // Simulating facial analysis and similarity matching
        addLog(user.id, user.name, user.role, "Facial Authentication", "Successfully validated access using facial metrics.");
        return res.json({
          success: true,
          match: true,
          similarity: 0.98,
          user,
          student: db.students.find((s) => s.userId === user.id)
        });
      }

      // If logging in solely by face matching (scanning registered face accounts)
      const enrolledUser = db.users.find((u) => u.faceEnrolled && u.faceData);
      if (!enrolledUser) {
        return res.status(404).json({
          error: "No enrolled face templates found in this demo context. Please sign in normally and register your face first!"
        });
      }

      addLog(enrolledUser.id, enrolledUser.name, enrolledUser.role, "Facial Login", "Authenticated via face vector scan.");
      res.json({
        success: true,
        match: true,
        similarity: 0.96,
        user: enrolledUser,
        student: db.students.find((s) => s.userId === enrolledUser.id)
      });
    } catch (err: any) {
      res.status(500).json({ error: "Facial biometric evaluation failed", details: err.message });
    }
  });

  // API Route: Face enrollment registration
  app.post("/api/auth/enroll-face", (req, res) => {
    try {
      const { userId, base64Image } = req.body;
      if (!userId || !base64Image) {
        return res.status(400).json({ error: "User ID and biometric template required." });
      }

      const db = readDB();
      const userIndex = db.users.findIndex((u) => u.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found." });
      }

      db.users[userIndex].faceEnrolled = true;
      db.users[userIndex].faceData = base64Image;
      
      // Also update student profile reference URL if it's a student
      const studentIndex = db.students.findIndex((s) => s.userId === userId);
      if (studentIndex !== -1) {
        db.students[studentIndex].faceEnrollmentUrl = base64Image;
      }

      writeDB(db);
      addLog(db.users[userIndex].id, db.users[userIndex].name, db.users[userIndex].role, "Facial Enrollment", "Enrolled facial biometric signature template.");
      
      res.json({ success: true, user: db.users[userIndex] });
    } catch (err: any) {
      res.status(500).json({ error: "Biometric registration failed", details: err.message });
    }
  });

  // API Route: Course registration submission (Student registering for courses)
  app.post("/api/registrations/register", (req, res) => {
    try {
      const { studentId, courseCodes, semester, actorName, actorRole } = req.body;
      if (!studentId || !courseCodes || !Array.isArray(courseCodes)) {
        return res.status(400).json({ error: "Student ID and target course codes are required." });
      }

      const db = readDB();
      const student = db.students.find((s) => s.id === studentId);
      if (!student) {
        return res.status(404).json({ error: "Student record not found." });
      }

      // Check credit limit and rules: 
      // Rule 1: Cannot register for the same course twice if approved
      // Rule 2: Cannot exceed semester credit hours limit (typically 18 credits)
      let totalCredits = 0;
      const proposedCourses = db.courses.filter((c) => courseCodes.includes(c.code));
      totalCredits = proposedCourses.reduce((sum, c) => sum + c.credits, 0);

      if (totalCredits > 18) {
        return res.status(400).json({
          error: `Registration exceeds credit hour threshold! Selected courses total ${totalCredits} credits, but semester limit is 18.`
        });
      }

      // Remove existing pending or draft registrations for this student and semester to overwrite with new submission
      db.registrations = db.registrations.filter(
        (r) => !(r.studentId === studentId && r.semester === semester && (r.status === "Draft" || r.status === "Pending_Advisor"))
      );

      // Create new registrations
      const newRegistrations = courseCodes.map((code) => ({
        id: `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId,
        courseCode: code,
        semester,
        status: "Pending_Advisor" as const,
        date: new Date().toISOString().split("T")[0]
      }));

      db.registrations.push(...newRegistrations);
      writeDB(db);

      addLog(
        student.userId,
        student.name,
        "Student",
        "Registration Submission",
        `Submitted registration for ${courseCodes.length} courses (${totalCredits} credits) in ${semester}.`
      );

      res.json({ success: true, registrations: newRegistrations });
    } catch (err: any) {
      res.status(500).json({ error: "Course registration failed", details: err.message });
    }
  });

  // API Route: Registration approvals / Add-Drop management (Advisor / Registrar approving)
  app.post("/api/registrations/approve", (req, res) => {
    try {
      const { registrationIds, status, advisorRemarks, actorId, actorName, actorRole } = req.body;
      if (!registrationIds || !Array.isArray(registrationIds) || !status) {
        return res.status(400).json({ error: "Registration details and approval status are required." });
      }

      const db = readDB();
      let affectedStudent = "";

      db.registrations = db.registrations.map((reg) => {
        if (registrationIds.includes(reg.id)) {
          affectedStudent = reg.studentId;
          return {
            ...reg,
            status,
            advisorRemarks: advisorRemarks || reg.advisorRemarks
          };
        }
        return reg;
      });

      writeDB(db);

      const studentName = db.students.find((s) => s.id === affectedStudent)?.name || affectedStudent;

      addLog(
        actorId,
        actorName,
        actorRole,
        "Registration Decision",
        `Reviewed and updated ${registrationIds.length} course registrations for student ${studentName} to state: ${status}.`
      );

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process registration review", details: err.message });
    }
  });

  // API Route: Save and Submit Course Grades (Instructor)
  app.post("/api/grades/submit", (req, res) => {
    try {
      const { gradesList, semester, courseCode, submitToDept, actorId, actorName, actorRole } = req.body;
      if (!gradesList || !Array.isArray(gradesList) || !courseCode) {
        return res.status(400).json({ error: "Grade spreadsheet dataset and course code are required." });
      }

      const db = readDB();

      // Grade schema mapper: Calculates total and letter grades
      const calculateGradeLetter = (total: number): string => {
        if (total >= 90) return "A+";
        if (total >= 85) return "A";
        if (total >= 80) return "A-";
        if (total >= 75) return "B+";
        if (total >= 70) return "B";
        if (total >= 65) return "B-";
        if (total >= 60) return "C+";
        if (total >= 50) return "C";
        if (total >= 45) return "C-";
        if (total >= 40) return "D";
        return "F";
      };

      gradesList.forEach((entry: any) => {
        const { studentId, continuousAssessment, finalExam } = entry;
        const ca = Number(continuousAssessment) || 0;
        const fe = Number(finalExam) || 0;
        const total = ca + fe;
        const letter = calculateGradeLetter(total);
        const nextStatus = submitToDept ? "Submitted_Dept" : "Draft";

        const existingGradeIndex = db.grades.findIndex(
          (g) => g.studentId === studentId && g.courseCode === courseCode && g.semester === semester
        );

        const timestamp = new Date().toISOString();
        const historyEntry = {
          status: nextStatus,
          actorName,
          actorRole,
          timestamp,
          remarks: submitToDept ? "Grades submitted to Department Head for approval." : "Saved as draft spreadsheet."
        };

        if (existingGradeIndex !== -1) {
          db.grades[existingGradeIndex] = {
            ...db.grades[existingGradeIndex],
            continuousAssessment: ca,
            finalExam: fe,
            total,
            letterGrade: letter,
            status: nextStatus,
            history: [...db.grades[existingGradeIndex].history, historyEntry]
          };
        } else {
          db.grades.push({
            id: `GR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            studentId,
            courseCode,
            semester,
            continuousAssessment: ca,
            finalExam: fe,
            total,
            letterGrade: letter,
            status: nextStatus,
            instructorId: actorId,
            history: [historyEntry]
          });
        }
      });

      writeDB(db);

      addLog(
        actorId,
        actorName,
        actorRole,
        submitToDept ? "Grades Submitted" : "Grades Draft Saved",
        `Processed grade records for course ${courseCode} (${gradesList.length} student records) for ${semester}.`
      );

      res.json({ success: true, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to record grades", details: err.message });
    }
  });

  // API Route: Multi-level Grade Approval Workflow
  // Workflow: Instructor -> Department Head -> Approval Committee -> Registrar Head -> Final Approval (Finalized)
  app.post("/api/grades/approve-bulk", (req, res) => {
    try {
      const { gradeIds, nextStatus, remarks, actorId, actorName, actorRole } = req.body;
      if (!gradeIds || !Array.isArray(gradeIds) || !nextStatus) {
        return res.status(400).json({ error: "Grade record selections and targeted approval state are required." });
      }

      const db = readDB();
      const timestamp = new Date().toISOString();

      db.grades = db.grades.map((grade) => {
        if (gradeIds.includes(grade.id)) {
          // If moving to Finalized, we also update student GPA & CGPA for demonstration simulation!
          if (nextStatus === "Finalized") {
            const student = db.students.find((s) => s.id === grade.studentId);
            if (student) {
              // Recalculate slightly to simulate grade locking and progression
              const creditHours = db.courses.find((c) => c.code === grade.courseCode)?.credits || 3;
              // Grade point values: A+=4.0, A=4.0, A-=3.75, B+=3.5, B=3.0, B-=2.75, C+=2.5, C=2.0, C-=1.75, D=1.0, F=0
              const gpMap: any = { "A+": 4.0, "A": 4.0, "A-": 3.75, "B+": 3.5, "B": 3.0, "B-": 2.75, "C+": 2.5, "C": 2.0, "C-": 1.75, "D": 1.0, "F": 0 };
              const currentGP = gpMap[grade.letterGrade] || 2.0;

              // Incremental simulation
              student.creditHoursCompleted += creditHours;
              student.gpa = parseFloat(((student.gpa * 3 + currentGP) / 4).toFixed(2));
              student.cgpa = parseFloat(((student.cgpa * 10 + currentGP) / 11).toFixed(2));

              // Auto Warning/Status adjustments
              if (student.cgpa < 2.0) {
                student.status = "Warning";
              } else if (student.cgpa >= 2.0 && student.status === "Warning") {
                student.status = "Active";
              }
            }
          }

          return {
            ...grade,
            status: nextStatus,
            history: [
              ...grade.history,
              {
                status: nextStatus,
                actorName,
                actorRole,
                timestamp,
                remarks
              }
            ]
          };
        }
        return grade;
      });

      writeDB(db);

      addLog(
        actorId,
        actorName,
        actorRole,
        `Grade Workflow Transition`,
        `Advanced ${gradeIds.length} grade sheets to status level: ${nextStatus}. Remarks: "${remarks || 'None'}".`
      );

      res.json({ success: true, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Workflow transition failed", details: err.message });
    }
  });

  // API Route: Record Academic Advising and Counseling Notes
  app.post("/api/advising/session", (req, res) => {
    try {
      const { advisorId, studentId, notes, recommendation, interventionPlan, actorName, actorRole } = req.body;
      if (!advisorId || !studentId || !notes) {
        return res.status(400).json({ error: "Advisor ID, Student ID, and session counseling notes are required." });
      }

      const db = readDB();
      const student = db.students.find((s) => s.id === studentId);
      const studentName = student ? student.name : studentId;

      const newSession = {
        id: `ADV-S-${Date.now()}`,
        advisorId,
        studentId,
        date: new Date().toISOString().split("T")[0],
        notes,
        recommendation: recommendation || "No general recommendations provided.",
        interventionPlan: interventionPlan || "Continue standard academic progression monitoring."
      };

      db.advisingSessions.push(newSession);
      writeDB(db);

      addLog(
        advisorId,
        actorName,
        actorRole,
        "Advising Session Logged",
        `Conducted and documented an academic advising panel with student ${studentName}.`
      );

      res.json({ success: true, session: newSession });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to document session", details: err.message });
    }
  });

  // API Route: AI-Based Academic Advisor Assistant (Gemini API)
  // Generates predictions, risk assessments, and tutoring recommendations based on student record
  app.post("/api/advising/ai-predict", async (req, res) => {
    try {
      const { studentId, advisorId, actorName, actorRole } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "Student ID required for biometric academic counseling evaluation." });
      }

      const db = readDB();
      const student = db.students.find((s) => s.id === studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found." });
      }

      const studentGrades = db.grades.filter((g) => g.studentId === studentId);
      const studentRegistrations = db.registrations.filter((r) => r.studentId === studentId);
      const studentDiscipline = db.disciplineCases.filter((d) => d.studentId === studentId);

      // Create a textual profile for the Gemini prompt
      const contextPrompt = `
      You are an AI Academic Advising Assistant at Agro Technical and Technology College (ATTC).
      Evaluate the student's record and generate:
      1. An academic warning risk assessment (High, Medium, Low).
      2. Student Performance Prediction (CGPA projections, graduation status).
      3. A detailed, actionable Academic Intervention Plan (remedial tutoring, load balance, study tracks).

      Student Profile:
      - Name: ${student.name}
      - ID: ${student.id}
      - Program: ${student.program} (Department: ${student.department})
      - Current Semester: ${student.semester}
      - Status: ${student.status} (Warning/Probation flag: ${student.status !== 'Active'})
      - GPA: ${student.gpa}
      - CGPA: ${student.cgpa}
      - Credits Completed: ${student.creditHoursCompleted}

      Grades History:
      ${studentGrades.map((g) => `- Course ${g.courseCode}: Total ${g.total}/100, Letter ${g.letterGrade} (${g.status})`).join("\n") || "No grades recorded yet."}

      Disciplinary History:
      ${studentDiscipline.map((d) => `- Violation: ${d.violation} on ${d.date}. Penalty: ${d.penalty} (Status: ${d.status})`).join("\n") || "Clean disciplinary record."}

      Target Registration Status:
      ${studentRegistrations.map((r) => `- Course ${r.courseCode}: Status ${r.status} (${r.semester})`).join("\n") || "No courses registered currently."}

      Format your response beautifully using clear Markdown, bullet points, and numbered lists. Write a professional, encouraging advising summary. Keep it focused on human academic counselling outcomes.
      `;

      let aiResponseText = "";
      if (ai) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contextPrompt,
        });
        aiResponseText = response.text || "AI Advisor summary currently unavailable.";
      } else {
        // Fallback mock assessment if Gemini key is missing or not configured
        aiResponseText = `### **ATTC AI Academic Advising Assessment**

**Student:** ${student.name} (${student.id})
**Overall Risk Status:** ${student.status === "Warning" ? "🚨 HIGH RISK" : "✅ LOW RISK"}

#### **1. Performance Projection**
- Based on the current GPA of **${student.gpa}** and CGPA of **${student.cgpa}**, ${student.name} is projected to maintain a steady course to graduation if current performance continues. 
- *Projections:* Graduation CGPA is estimated to settle around **${student.cgpa}** to **${Math.min(4.0, student.cgpa + 0.1).toFixed(2)}**.

#### **2. Risk Analysis**
- ${student.status === "Warning" ? "The student is currently flagged with a warning. Urgent intervention in courses with failing or borderline grades (e.g. C- or lower) is essential to pull the cumulative GPA above the required 2.00 threshold." : "The student exhibits robust study habits with zero active warning flags. Academic trajectory remains highly satisfactory."}
- Disciplinary actions: ${studentDiscipline.length > 0 ? "⚠️ Records indicate past infractions. Mindful behavioral guidance should be paired with academic reviews." : "Clean compliance record maintained."}

#### **3. Suggested Actionable Intervention Plan**
1. **Academic Coaching:** Connect with Peer Tutors for complex core courses.
2. **Weekly Progress Audits:** The designated advisor (${db.users.find(u => u.id === student.advisorId)?.name || 'Advisor'}) should perform a quick weekly grade check.
3. **Credit Cap Restriction:** Keep future semester registration bounded to 12-15 credits to optimize learning outcomes until the warning status clears.`;
      }

      // Automatically store this as an advising session insight
      const sessionIndex = db.advisingSessions.findIndex((s) => s.studentId === studentId && s.advisorId === advisorId);
      if (sessionIndex !== -1) {
        db.advisingSessions[sessionIndex].aiInsights = aiResponseText;
      } else {
        db.advisingSessions.push({
          id: `ADV-S-${Date.now()}`,
          advisorId: advisorId || "ADV-001",
          studentId,
          date: new Date().toISOString().split("T")[0],
          notes: "AI Automated Student Progress Risk analysis & prediction generation.",
          recommendation: "Review the AI generated intervention report during next face-to-face advising session.",
          interventionPlan: "Generated automated academic counseling dashboard metrics.",
          aiInsights: aiResponseText
        });
      }

      writeDB(db);

      addLog(
        advisorId || "ADV-001",
        actorName || "Academic Advisor",
        actorRole || "Academic Advisor",
        "AI Advising Prediction",
        `Generated smart performance risk predictive audit and counseling notes for student ${student.name}.`
      );

      res.json({ success: true, aiInsights: aiResponseText, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "AI advising modeling failed", details: err.message });
    }
  });

  // API Route: Create Grade Appeal / Re-marking request
  app.post("/api/appeals/create", (req, res) => {
    try {
      const { studentId, courseCode, reason, actorName, actorRole } = req.body;
      if (!studentId || !courseCode || !reason) {
        return res.status(400).json({ error: "Student ID, course code, and detailed appeal reason are required." });
      }

      const db = readDB();
      const studentGrade = db.grades.find((g) => g.studentId === studentId && g.courseCode === courseCode);
      if (!studentGrade) {
        return res.status(404).json({ error: "No finalized grade record found for this course registration." });
      }

      const newAppeal = {
        id: `APP-${Date.now()}`,
        studentId,
        courseCode,
        originalGrade: studentGrade.letterGrade,
        originalTotal: studentGrade.total,
        reason,
        status: "Pending" as const,
        date: new Date().toISOString().split("T")[0]
      };

      db.appeals.push(newAppeal);
      writeDB(db);

      addLog(
        db.users.find(u => u.name === actorName)?.id || "STUD-001",
        actorName,
        actorRole,
        "Grade Appeal Submitted",
        `Submitted grade re-marking appeal request for course ${courseCode}. Reason: "${reason}".`
      );

      res.json({ success: true, appeal: newAppeal });
    } catch (err: any) {
      res.status(500).json({ error: "Grade appeal submission failed", details: err.message });
    }
  });

  // API Route: Review and Resolve Appeal
  app.post("/api/appeals/resolve", (req, res) => {
    try {
      const { appealId, status, resolverNotes, newContinuousAssessment, newFinalExam, actorId, actorName, actorRole } = req.body;
      if (!appealId || !status || !resolverNotes) {
        return res.status(400).json({ error: "Appeal ID, action state, and review resolution notes are required." });
      }

      const db = readDB();
      const appealIndex = db.appeals.findIndex((a) => a.id === appealId);
      if (appealIndex === -1) {
        return res.status(404).json({ error: "Appeal record not found." });
      }

      const appeal = db.appeals[appealIndex];
      db.appeals[appealIndex].status = status;
      db.appeals[appealIndex].resolverNotes = resolverNotes;
      db.appeals[appealIndex].resolvedDate = new Date().toISOString().split("T")[0];

      // If approved, we recalculate the grade!
      if (status === "Resolved_Approved") {
        const gradeIndex = db.grades.findIndex(
          (g) => g.studentId === appeal.studentId && g.courseCode === appeal.courseCode
        );

        if (gradeIndex !== -1) {
          const ca = newContinuousAssessment !== undefined ? Number(newContinuousAssessment) : db.grades[gradeIndex].continuousAssessment;
          const fe = newFinalExam !== undefined ? Number(newFinalExam) : db.grades[gradeIndex].finalExam;
          const total = ca + fe;
          
          const calculateGradeLetter = (t: number): string => {
            if (t >= 90) return "A+";
            if (t >= 85) return "A";
            if (t >= 80) return "A-";
            if (t >= 75) return "B+";
            if (t >= 70) return "B";
            if (t >= 65) return "B-";
            if (t >= 60) return "C+";
            if (t >= 50) return "C";
            if (t >= 45) return "C-";
            if (t >= 40) return "D";
            return "F";
          };

          const newLetter = calculateGradeLetter(total);

          db.appeals[appealIndex].newContinuousAssessment = ca;
          db.appeals[appealIndex].newFinalExam = fe;
          db.appeals[appealIndex].newTotal = total;
          db.appeals[appealIndex].newLetterGrade = newLetter;

          // Update actual grade
          db.grades[gradeIndex].continuousAssessment = ca;
          db.grades[gradeIndex].finalExam = fe;
          db.grades[gradeIndex].total = total;
          db.grades[gradeIndex].letterGrade = newLetter;
          db.grades[gradeIndex].history.push({
            status: "Finalized",
            actorName,
            actorRole,
            timestamp: new Date().toISOString(),
            remarks: `Grade revised via successful grade re-marking appeal: ${appeal.originalGrade} (${appeal.originalTotal}) -> ${newLetter} (${total}).`
          });
        }
      }

      writeDB(db);

      const studentName = db.students.find((s) => s.id === appeal.studentId)?.name || appeal.studentId;

      addLog(
        actorId,
        actorName,
        actorRole,
        "Grade Appeal Resolved",
        `Resolved grade re-marking appeal for student ${studentName} on course ${appeal.courseCode} with decision: ${status}.`
      );

      res.json({ success: true, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to resolve appeal", details: err.message });
    }
  });

  // API Route: Register Disciplinary Case (Discipline Officer)
  app.post("/api/discipline/create", (req, res) => {
    try {
      const { studentId, violation, description, warningLevel, penalty, status, actorId, actorName, actorRole } = req.body;
      if (!studentId || !violation || !description) {
        return res.status(400).json({ error: "Student ID, specific violation type, and details are required." });
      }

      const db = readDB();
      const student = db.students.find((s) => s.id === studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found." });
      }

      const newCase = {
        id: `DISC-${Date.now()}`,
        studentId,
        violation,
        date: new Date().toISOString().split("T")[0],
        description,
        warningLevel: warningLevel || "None",
        penalty: penalty || "Pending formal penalty review panel.",
        status: status || "Pending",
        officerId: actorId
      };

      db.disciplineCases.push(newCase);

      // If warning level is Suspension, update the student status
      if (warningLevel === "Suspended") {
        const studentIndex = db.students.findIndex((s) => s.id === studentId);
        if (studentIndex !== -1) {
          db.students[studentIndex].status = "Suspended";
        }
      }

      writeDB(db);

      addLog(
        actorId,
        actorName,
        actorRole,
        "Disciplinary Case Filed",
        `Registered formal disciplinary charge against student ${student.name} for: "${violation}".`
      );

      res.json({ success: true, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to record case file", details: err.message });
    }
  });

  // API Route: Resolve Disciplinary Case
  app.post("/api/discipline/resolve", (req, res) => {
    try {
      const { caseId, status, penalty, warningLevel, actorId, actorName, actorRole } = req.body;
      if (!caseId || !status) {
        return res.status(400).json({ error: "Case ID and status required." });
      }

      const db = readDB();
      const caseIndex = db.disciplineCases.findIndex((c) => c.id === caseId);
      if (caseIndex === -1) {
        return res.status(404).json({ error: "Disciplinary case file not found." });
      }

      const c = db.disciplineCases[caseIndex];
      db.disciplineCases[caseIndex].status = status;
      if (penalty) db.disciplineCases[caseIndex].penalty = penalty;
      if (warningLevel) db.disciplineCases[caseIndex].warningLevel = warningLevel;

      // Update student status based on warning level if resolved/applied
      if (warningLevel === "Suspended") {
        const sIdx = db.students.findIndex((s) => s.id === c.studentId);
        if (sIdx !== -1) db.students[sIdx].status = "Suspended";
      } else if (warningLevel === "None" || warningLevel === "Verbal" || warningLevel === "Written") {
        const sIdx = db.students.findIndex((s) => s.id === c.studentId);
        if (sIdx !== -1 && db.students[sIdx].status === "Suspended") {
          db.students[sIdx].status = "Active"; // reinstate
        }
      }

      writeDB(db);
      const studentName = db.students.find((s) => s.id === c.studentId)?.name || c.studentId;

      addLog(
        actorId,
        actorName,
        actorRole,
        "Disciplinary Case Resolved",
        `Resolved or modified disciplinary file ${caseId} for student ${studentName}. Decision: ${status}.`
      );

      res.json({ success: true, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to resolve disciplinary file", details: err.message });
    }
  });

  // API Route: Graduation Clearance and Audit Process
  app.post("/api/graduation/audit", (req, res) => {
    try {
      const { studentId, clearAcademic, awardMedal, actorId, actorName, actorRole } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "Student ID required for degree requirements audit." });
      }

      const db = readDB();
      const student = db.students.find((s) => s.id === studentId);
      if (!student) {
        return res.status(404).json({ error: "Student record not found." });
      }

      // Check credit requirement. Let's find program total credits required
      const programObj = db.programs.find((p) => p.name === student.program);
      const creditsRequired = programObj ? programObj.totalCreditsRequired : 120;
      
      const isEligible = student.creditHoursCompleted >= creditsRequired && student.cgpa >= 2.0;

      // Determine classification
      let classification: GraduationRecord["classification"] = "None";
      if (isEligible) {
        if (student.cgpa >= 3.75) classification = "First Class with Great Distinction";
        else if (student.cgpa >= 3.5) classification = "First Class with Distinction";
        else if (student.cgpa >= 3.25) classification = "Great Distinction";
        else if (student.cgpa >= 3.0) classification = "Distinction";
        else classification = "Pass";
      }

      const existingRecordIndex = db.graduationRecords.findIndex((g) => g.studentId === studentId);

      const record: GraduationRecord = {
        id: existingRecordIndex !== -1 ? db.graduationRecords[existingRecordIndex].id : `GRAD-R-${Date.now()}`,
        studentId,
        programId: programObj ? programObj.id : "PROG-CSIT",
        gpa: student.gpa,
        cgpa: student.cgpa,
        eligible: isEligible,
        classification,
        awardMedal: awardMedal || "None",
        clearanceStatus: clearAcademic ? "Cleared" : "Pending",
        approvedBy: actorName,
        approvedDate: new Date().toISOString().split("T")[0]
      };

      if (existingRecordIndex !== -1) {
        db.graduationRecords[existingRecordIndex] = record;
      } else {
        db.graduationRecords.push(record);
      }

      // If fully eligible and cleared, mark student as graduated
      if (isEligible && clearAcademic) {
        const studentIndex = db.students.findIndex((s) => s.id === studentId);
        if (studentIndex !== -1) {
          db.students[studentIndex].status = "Graduated";
        }
      }

      writeDB(db);

      addLog(
        actorId,
        actorName,
        actorRole,
        "Degree Audit Checked",
        `Conducted digital degree audit for student ${student.name}. Eligibility: ${isEligible ? "PASSED" : "FAILED"}. Clearance: ${record.clearanceStatus}.`
      );

      res.json({ success: true, record, db: readDB() });
    } catch (err: any) {
      res.status(500).json({ error: "Graduation audit evaluation failed", details: err.message });
    }
  });

  // Vite development middleware vs Static asset server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIMS Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
