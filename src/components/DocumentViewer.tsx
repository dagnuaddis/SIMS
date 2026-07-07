import React from "react";
import { Download, Printer, Award, FileText, CheckCircle } from "lucide-react";
import { Student, Grade, Course, DBStructure } from "../types";

interface DocumentViewerProps {
  student: Student;
  db: DBStructure;
  docType: "transcript" | "diploma";
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  student,
  db,
  docType,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Extract student details
  const grades = db.grades.filter((g) => g.studentId === student.id && g.status === "Finalized");
  const courses = db.courses;

  const getCourseName = (code: string) => {
    return courses.find((c) => c.code === code)?.name || "Academic Requirement";
  };

  const getCourseCredits = (code: string) => {
    return courses.find((c) => c.code === code)?.credits || 3;
  };

  // Group grades by semester for structured transcript view
  const semesters = Array.from(new Set(grades.map((g) => g.semester)));

  // Calculate Honors/Medals if eligible
  const isExcellent = student.cgpa >= 3.75;
  const isMedal = student.cgpa >= 3.90 && student.creditHoursCompleted >= 110;

  return (
    <div className="bg-slate-900/60 inset-0 fixed z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Document HUD Controls */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {docType === "transcript" ? (
              <FileText className="w-5 h-5 text-emerald-400" />
            ) : (
              <Award className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-white font-semibold text-sm">
              Document Viewer: Official ATTC {docType === "transcript" ? "Official Transcript" : "Temporary Certificate"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Document Page Frame (Scrollable area) */}
        <div className="overflow-y-auto p-6 md:p-10 bg-slate-850 flex-1 flex justify-center">
          
          {docType === "transcript" ? (
            /* ================= OFFICIAL TRANSCRIPT VIEW ================= */
            <div id="printable-area" className="bg-white text-slate-900 w-full max-w-[800px] p-8 rounded-lg shadow-lg border border-slate-200 relative font-sans text-xs">
              
              {/* Transcript Seal Watermark in the background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <div className="w-96 h-96 rounded-full border-[16px] border-emerald-900 flex flex-col items-center justify-center font-bold text-slate-900 p-8 text-center uppercase tracking-widest text-lg">
                  <span>Agro Technical &</span>
                  <span>Technology College</span>
                  <div className="w-16 h-1 bg-emerald-900 my-4" />
                  <span className="text-xs">OFFICIAL RECORDS SEAl</span>
                </div>
              </div>

              {/* Header */}
              <div className="text-center border-b-2 border-emerald-800 pb-4 mb-6">
                <h1 className="text-xl font-bold uppercase font-display text-emerald-900">
                  Agro Technical & Technology College
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Post Office Box 12, Awassa, Ethiopia • Office of the Registrar
                </p>
                <div className="mt-4 text-center">
                  <h2 className="text-sm font-bold bg-emerald-900 text-white inline-block px-4 py-1 rounded uppercase tracking-wider text-[11px]">
                    Official Academic Transcript
                  </h2>
                </div>
              </div>

              {/* Student Demographics Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6 border border-slate-200 bg-slate-50 p-4 rounded">
                <div>
                  <div className="grid grid-cols-[110px_1fr] gap-1">
                    <span className="font-semibold text-slate-500">Student Name:</span>
                    <span className="text-slate-900 font-bold">{student.name}</span>
                    
                    <span className="font-semibold text-slate-500">ID Number:</span>
                    <span className="text-slate-900 font-mono font-bold">{student.id}</span>
                    
                    <span className="font-semibold text-slate-500">Admission Year:</span>
                    <span className="text-slate-900">2023 (EC 2015)</span>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-[110px_1fr] gap-1">
                    <span className="font-semibold text-slate-500">Department:</span>
                    <span className="text-slate-900">{student.department}</span>
                    
                    <span className="font-semibold text-slate-500">Program:</span>
                    <span className="text-slate-900">{student.program}</span>
                    
                    <span className="font-semibold text-slate-500">Status:</span>
                    <span className="text-slate-900">
                      <span className="font-bold text-emerald-700">{student.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Transcript Semester Iterations */}
              <div className="space-y-6">
                {semesters.length > 0 ? (
                  semesters.map((sem, sIdx) => {
                    const semGrades = grades.filter((g) => g.semester === sem);
                    let semCredits = 0;
                    let semPoints = 0;
                    const gpMap: any = { "A+": 4.0, "A": 4.0, "A-": 3.75, "B+": 3.5, "B": 3.0, "B-": 2.75, "C+": 2.5, "C": 2.0, "C-": 1.75, "D": 1.0, "F": 0 };

                    semGrades.forEach((g) => {
                      const c = getCourseCredits(g.courseCode);
                      semCredits += c;
                      semPoints += c * (gpMap[g.letterGrade] || 2.0);
                    });

                    const semGPA = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "0.00";

                    return (
                      <div key={sIdx} className="border border-slate-200 rounded overflow-hidden">
                        <div className="bg-emerald-50 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-emerald-900 uppercase tracking-wide text-[10px]">
                            {sem}
                          </span>
                          <span className="font-mono text-[9px] text-emerald-800">
                            SGPA: {semGPA}
                          </span>
                        </div>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[9px] uppercase font-bold">
                              <th className="p-2 w-20">Course Code</th>
                              <th className="p-2">Course Title</th>
                              <th className="p-2 w-16 text-center">Credit Hours</th>
                              <th className="p-2 w-16 text-center">Numeric Score</th>
                              <th className="p-2 w-16 text-center">Letter Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {semGrades.map((g, gIdx) => (
                              <tr key={gIdx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-mono font-medium text-slate-700">{g.courseCode}</td>
                                <td className="p-2 text-slate-900">{getCourseName(g.courseCode)}</td>
                                <td className="p-2 text-center text-slate-700">{getCourseCredits(g.courseCode)}</td>
                                <td className="p-2 text-center text-slate-700">{g.total}</td>
                                <td className="p-2 text-center font-bold text-slate-900">{g.letterGrade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded">
                    No finalized semester courses or academic credits lock completed yet for this student. Complete the multi-level grade approval workflow using Registrar Head to finalize grades.
                  </div>
                )}
              </div>

              {/* Cumulative Summary Stats */}
              <div className="mt-8 border-2 border-emerald-900/10 rounded-lg p-4 bg-emerald-50/30 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[10px] mb-1">
                    CUMULATIVE PERFORMANCE SUMMARY
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-slate-700 text-[11px]">
                    <div>
                      Total Credits Completed: <strong className="text-slate-900">{student.creditHoursCompleted} CH</strong>
                    </div>
                    <div>
                      Cumulative GPA (CGPA): <strong className="text-emerald-800 font-bold font-mono">{student.cgpa.toFixed(2)}</strong>
                    </div>
                    <div>
                      Academic Standing: <strong className="text-slate-900 uppercase font-semibold">{student.status}</strong>
                    </div>
                    <div>
                      Honors Distinction: <strong className="text-slate-900">{isExcellent ? "First Class Honors" : "N/A"}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Audit Validation Key</span>
                  <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1">
                    ATTC-SIMS-SECURE-{student.id}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t border-slate-100 text-center text-[10px]">
                <div className="flex flex-col items-center">
                  <div className="h-10 flex items-end justify-center select-none font-serif italic text-slate-400 text-lg">
                    <span>Ato Kassahun B.</span>
                  </div>
                  <div className="w-40 border-t border-slate-300 my-1" />
                  <span className="font-bold text-slate-700">Ato Kassahun Belay</span>
                  <span className="text-slate-500 uppercase tracking-wider text-[9px]">Registrar Head</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 flex items-end justify-center select-none font-mono text-xs text-slate-300">
                    [ OFFICIAL SEAL SPACE ]
                  </div>
                  <div className="w-40 border-t border-slate-300 my-1" />
                  <span className="font-bold text-slate-700">Awassa Campus Office</span>
                  <span className="text-slate-500 uppercase tracking-wider text-[9px]">Date Generated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

            </div>
          ) : (
            /* ================= DIPLOMA / CERTIFICATE OF GRADUATION VIEW ================= */
            <div id="printable-area" className="bg-amber-50 text-slate-900 w-full max-w-[800px] p-12 rounded-lg shadow-lg border-[10px] border-amber-900/10 relative font-serif text-center aspect-[1.414]">
              
              {/* Detailed gold flourishes */}
              <div className="absolute inset-4 border-2 border-amber-800/20 rounded pointer-events-none" />
              <div className="absolute inset-6 border border-amber-800/10 rounded pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                <Award className="w-80 h-80 text-amber-950" />
              </div>

              {/* Certificate content */}
              <div className="mt-4">
                <span className="text-amber-800 font-bold uppercase tracking-widest text-[11px] block mb-3 font-sans">
                  Agro Technical & Technology College
                </span>
                <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-wide">
                  Certificate of Graduation
                </h1>
                <div className="w-24 h-0.5 bg-amber-700 mx-auto my-6" />
                
                <p className="text-xs text-slate-500 italic mb-6">
                  This academic award certifies that the Academic Board, upon recommendation of the faculty, has conferred on
                </p>

                <h2 className="text-2xl font-bold text-amber-950 font-serif my-4 decoration-amber-700 underline underline-offset-8">
                  {student.name}
                </h2>

                <p className="text-xs text-slate-500 italic my-6">
                  the degree of
                </p>

                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2 font-sans">
                  {student.program}
                </h3>
                
                {isExcellent && (
                  <span className="inline-block bg-amber-600/15 border border-amber-500/30 text-amber-800 font-sans font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider mt-1">
                    With High Honors {isMedal ? `& Recipient of the Dean's Gold Medal` : ""}
                  </span>
                )}

                <p className="text-xs text-slate-500 italic mt-8 max-w-lg mx-auto leading-relaxed">
                  having successfully satisfied all coursework, credit modules, core agricultural technical assessments, and graduation clearance guidelines prescribed by ATTC regulations.
                </p>
              </div>

              {/* Seal and Signatures */}
              <div className="mt-12 grid grid-cols-3 gap-6 pt-6 text-[10px] font-sans">
                <div className="flex flex-col items-center">
                  <div className="h-10 flex items-end justify-center select-none font-serif italic text-slate-400 text-sm">
                    Dean Haile S.
                  </div>
                  <div className="w-32 border-t border-slate-300 my-1" />
                  <span className="font-bold text-slate-700">Dean Haile Selassie</span>
                  <span className="text-slate-500 text-[9px]">College Dean</span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-700/50 flex items-center justify-center text-[8px] font-bold text-amber-800 font-sans uppercase tracking-widest leading-tight p-1 border-dashed">
                    ATTC AWASSA
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">SEAL VALID</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-10 flex items-end justify-center select-none font-serif italic text-slate-400 text-sm">
                    Ato Kassahun B.
                  </div>
                  <div className="w-32 border-t border-slate-300 my-1" />
                  <span className="font-bold text-slate-700">Ato Kassahun Belay</span>
                  <span className="text-slate-500 text-[9px]">Registrar Head</span>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 font-mono mt-12 text-center">
                Certificate ID: ATTC-GRAD-2026-REG-{student.id} • Issued Awassa, Ethiopia
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
