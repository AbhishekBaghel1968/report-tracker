import { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, X, ShieldCheck, VideoOff, Loader2 } from "lucide-react";

function FaceVerificationModal({ isOpen, onClose, onVerified }) {
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
    return () => stopCamera();
  }, [isOpen]);

  const resetState = () => {
    setCapturedImage(null);
    setVerified(false);
    setScanning(false);
    setError("");
  };

  const startCamera = async () => {
    setError("");
    setLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("Webcam access blocked or unavailable. Ensure permissions are granted.");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 300;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
      stopCamera();
      runBiometricScan();
    }
  };

  const runBiometricScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setVerified(true);
      setTimeout(() => {
        onVerified(true);
        onClose();
      }, 1500);
    }, 2500); // 2.5 seconds biometric scanning simulation
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(3, 3, 7, 0.9)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999999,
      padding: "20px"
    }}>
      <div style={{
        background: "rgba(10, 10, 18, 0.98)",
        border: "1px solid var(--glass-border)",
        borderRadius: "16px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 240, 255, 0.05)",
        width: "100%",
        maxWidth: "460px",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)" }}>
          <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
            🔐 BIOMETRIC PORTAL VERIFICATION
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder container */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            position: "relative",
            width: "360px",
            height: "270px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Corner brackets */}
            <div style={{ position: "absolute", top: "12px", left: "12px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "16px", height: "16px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "16px", height: "16px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

            {/* Video Viewfinder */}
            {stream && !capturedImage && (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}

            {/* Snapshot Preview */}
            {capturedImage && (
              <img src={capturedImage} alt="Biometric Snap" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}

            {/* Loading / Error States */}
            {loading && (
              <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                <Loader2 size={32} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>Tuning sensor lens...</p>
              </div>
            )}

            {error && (
              <div style={{ textAlign: "center", color: "var(--danger)", padding: "20px" }}>
                <VideoOff size={32} style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "0.8rem" }}>{error}</p>
              </div>
            )}

            {/* Scanning overlay */}
            {scanning && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 240, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {/* Horizontal scanner bar */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "var(--accent)",
                  boxShadow: "0 0 10px var(--accent)",
                  animation: "scanLine 2s linear infinite"
                }} />
                <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: "800", letterSpacing: "1px", background: "rgba(10,10,18,0.8)", padding: "4px 12px", borderRadius: "100px" }}>
                  MAPPING CYTOMETRY NODES
                </span>
              </div>
            )}

            {/* Verified overlay */}
            {verified && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ShieldCheck size={48} color="var(--success)" style={{ filter: "drop-shadow(0 0 10px var(--success))", marginBottom: "8px" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: "800", letterSpacing: "1px", background: "rgba(10,10,18,0.8)", padding: "4px 12px", borderRadius: "100px" }}>
                  PRESENCE CONFIRMED
                </span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Verification Advice */}
          <p style={{ margin: "20px 0 0", color: "var(--text-secondary)", fontSize: "0.8rem", textAlign: "center", lineHeight: "1.4" }}>
            Ensure your face is well-lit and centered in the frame. Sentinel logs biometrics cryptographically.
          </p>
        </div>

        {/* Footer controls */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "rgba(255,255,255,0.01)" }}>
          {stream && !capturedImage && (
            <button
              onClick={capturePhoto}
              style={{
                width: "auto",
                background: "var(--accent)",
                color: "#07070d",
                padding: "8px 18px",
                borderRadius: "4px",
                fontWeight: "700",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                marginBottom: 0
              }}
            >
              <Camera size={14} /> Snap biometric
            </button>
          )}

          {error && (
            <button
              onClick={startCamera}
              style={{
                width: "auto",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                padding: "8px 18px",
                borderRadius: "4px",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginBottom: 0
              }}
            >
              Retry connection
            </button>
          )}
        </div>
      </div>

      {/* Animation Style tag */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}

export default FaceVerificationModal;
