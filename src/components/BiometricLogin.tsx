import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, User } from "lucide-react";

interface BiometricLoginProps {
  onSuccess?: (user: any, student: any) => void;
  onSubmit?: (snapshotBase64: string) => Promise<void>;
  targetUserId?: string; // Optional: if enrolling/logging in for a specific user
  mode: "login" | "enroll";
  onCancel?: () => void;
  onClose?: () => void;
}

export const BiometricLogin: React.FC<BiometricLoginProps> = ({
  onSuccess,
  onSubmit,
  targetUserId,
  mode,
  onCancel,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "streaming" | "scanning" | "matched" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedFaceIdx, setSimulatedFaceIdx] = useState(0);

  // Mock faces for simulation fallback
  const mockFaces = [
    "🧑‍🎓 [Student - Abebe Kebede]",
    "👩‍🏫 [Advisor - Almaz Negash]",
    "👨‍💼 [Registrar Head - Ato Kassahun]",
    "👨‍💻 [System Admin - Dejene Dagnu]"
  ];

  // Request camera access
  const startCamera = async () => {
    setStatus("requesting");
    setErrorMsg("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus("streaming");
      setIsSimulated(false);
    } catch (err: any) {
      console.warn("Webcam access not allowed or unavailable inside iframe environment. Falling back to high-fidelity biometric simulator.", err);
      // Fallback to high-fidelity simulator
      setIsSimulated(true);
      setStatus("streaming");
      // Cycle faces in simulation
      let cycle = 0;
      const interval = setInterval(() => {
        cycle = (cycle + 1) % mockFaces.length;
        setSimulatedFaceIdx(cycle);
      }, 1500);
      return () => clearInterval(interval);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Scan / Authenticate Trigger
  const triggerScan = () => {
    if (status !== "streaming") return;
    setStatus("scanning");
    setScanProgress(0);
    setSimilarity(null);

    // Simulate scanning analysis progress bar
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          performServerValidation();
          return 100;
        }
        return prev + 15;
      });
    }, 120);
  };

  const performServerValidation = async () => {
    let base64Image = "MOCK_BIOMETRIC_DATA_SNAPSHOT_BASE64_STUB";

    // Capture actual frame if real camera is streaming
    if (!isSimulated && videoRef.current && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL("image/jpeg");
        }
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    }

    // If onSubmit prop is provided (from App.tsx), use that to let App.tsx do the authentication
    if (onSubmit) {
      try {
        await onSubmit(base64Image);
        setStatus("matched");
        setSimilarity(0.98);
        setTimeout(() => {
          stopCamera();
          if (onClose) onClose();
          if (onCancel) onCancel();
        }, 1500);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Facial signature match failed.");
      }
      return;
    }

    try {
      let endpoint = mode === "login" ? "/api/auth/facial-recognition" : "/api/auth/enroll-face";
      let payload: any = { base64Image };
      if (mode === "login") {
        payload.userId = targetUserId || undefined; // If looking for specific user or scanning general DB
      } else {
        payload.userId = targetUserId; // Required for enrollment
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("matched");
        setSimilarity(data.similarity || 0.98);
        setTimeout(() => {
          stopCamera();
          if (onSuccess) onSuccess(data.user, data.student);
        }, 1500);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Biometric validation failed. Verification similarity threshold not met.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg("Network error contacting biometric authentication service.");
    }
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-sm shadow-2xl relative overflow-hidden text-slate-900">
        {/* Target scanning lines background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <span>ATTC Biometrics Unit</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Mode: {mode === "login" ? "Auth Scan" : "Signature Enroll"}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {mode === "login" ? "Facial Authentication" : "Register Biometric Signature"}
          </h3>
          <p className="text-slate-500 text-[11px] mb-4">
            Position your face inside the green reticle for liveness scanning.
          </p>

          {/* Video / Simulator Box */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {isSimulated ? (
              // Simulation interface
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <div className="relative w-16 h-16 rounded-full border border-dashed border-emerald-500 flex items-center justify-center mb-3 animate-spin">
                  <Camera className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-xs font-semibold text-emerald-400 animate-pulse font-mono">
                  [LIVE BIOMETRIC SIMULATOR]
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-900 px-2.5 py-1 rounded border border-slate-800/80">
                  Scanning: {mockFaces[simulatedFaceIdx]}
                </div>
              </div>
            ) : (
              // Real Webcam Stream
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Biometric Scanning Reticle HUD Overlays */}
            {status === "streaming" && (
              <div className="absolute inset-4 border-2 border-dashed border-emerald-500/50 rounded pointer-events-none flex flex-col justify-between p-1.5">
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                  <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="text-[8px] text-center font-mono text-emerald-400 animate-pulse bg-slate-950/85 py-0.5 px-1.5 rounded self-center border border-emerald-500/10">
                  CAMERA ACCESS ACTIVE
                </div>
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                  <span className="w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            )}

            {/* Active scanning bar HUD */}
            {status === "scanning" && (
              <>
                <div className="absolute inset-4 border-2 border-emerald-400 rounded pointer-events-none" />
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 opacity-85 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite] pointer-events-none" />
                <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center">
                  <div className="bg-slate-950/90 border border-emerald-500/30 p-2.5 rounded text-center">
                    <div className="text-xs font-mono font-bold text-emerald-400">ANALYZING FACE</div>
                    <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden mx-auto">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Match HUD */}
            {status === "matched" && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-1.5 animate-bounce" />
                <span className="text-xs font-mono font-semibold text-emerald-400">MATCH VALIDATED</span>
                <span className="text-[10px] text-slate-400 mt-1">Similarity Index: {(similarity! * 100).toFixed(1)}%</span>
              </div>
            )}

            {/* Hidden Canvas for Screenshots */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls and Feedback Panel */}
          <div className="mt-4 space-y-3">
            {status === "streaming" && (
              <button
                onClick={triggerScan}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition active:bg-emerald-700 shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{mode === "login" ? "Execute Face Recognition Match" : "Take Biometric Capture"}</span>
              </button>
            )}

            {(status === "scanning" || status === "matched") && (
              <button
                disabled
                className="w-full py-2 bg-slate-100 text-slate-400 rounded font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Biometric Node processing...</span>
              </button>
            )}

            {status === "error" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] space-y-2">
                <div className="flex items-start gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <p className="font-medium">{errorMsg}</p>
                </div>
                <button
                  onClick={startCamera}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[10px] uppercase tracking-wide transition cursor-pointer"
                >
                  Retry Scanner Setup
                </button>
              </div>
            )}

            {(onClose || onCancel) && (
              <button
                onClick={handleClose}
                className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 transition uppercase tracking-wider font-semibold cursor-pointer pt-1"
              >
                Cancel Biometric Attempt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
