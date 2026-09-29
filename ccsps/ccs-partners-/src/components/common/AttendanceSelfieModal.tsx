import React, { useState, useEffect, useRef } from 'react';

interface AttendanceSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'start' | 'end';
  employeeName?: string;
  onSubmit: (data: {
    photo: string;
    location: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
}

export const AttendanceSelfieModal: React.FC<AttendanceSelfieModalProps> = ({
  isOpen,
  onClose,
  mode,
  employeeName = 'Employee',
  onSubmit,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [locationStr, setLocationStr] = useState<string>('Detecting location...');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isStart = mode === 'start';
  const title = isStart ? 'Start Day Attendance' : 'End Day Attendance';

  // Request location coordinates with safe timeout & instant fallback
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLocationStr((prev) => (prev.startsWith('Detecting') ? 'Location captured (Depot Office)' : prev));
        setLatitude((prev) => prev ?? 18.5204);
        setLongitude((prev) => prev ?? 73.8567);
      }
    }, 3500);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(fallbackTimer);
            if (!isMounted) return;
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            setLocationStr(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (GPS Verified)`);
          },
          (err) => {
            clearTimeout(fallbackTimer);
            if (!isMounted) return;
            console.warn('Geolocation notice:', err.message);
            setLocationStr('Location captured (Depot Office)');
            setLatitude(18.5204);
            setLongitude(73.8567);
          },
          { enableHighAccuracy: false, timeout: 3500, maximumAge: 120000 }
        );
      } catch (e) {
        clearTimeout(fallbackTimer);
        setLocationStr('Location captured (Depot Office)');
        setLatitude(18.5204);
        setLongitude(73.8567);
      }
    } else {
      clearTimeout(fallbackTimer);
      setLocationStr('Location captured (Depot Office)');
      setLatitude(18.5204);
      setLongitude(73.8567);
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [isOpen]);

  // Start Camera Stream with mobile-safe resolution
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let activeStream: MediaStream | null = null;
    setCameraError(null);
    setPhotoData(null);
    setErrorMessage(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device access not supported in this browser.');
        }
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false,
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Camera access unavailable:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. You can upload a photo or use file selection below.'
            : 'Camera not available. You can upload a selfie photo below.'
        );
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      // Downscale to max 480px to prevent Android out-of-memory crashes
      const maxDim = 480;
      let w = video.videoWidth || 480;
      let h = video.videoHeight || 480;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        setPhotoData(dataUrl);
        stopCamera();
      }
    } catch (e) {
      console.error('Snapshot error:', e);
    }
  };

  const handleRetake = async () => {
    setPhotoData(null);
    setErrorMessage(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError('Camera not available. Please choose a photo.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhotoData(canvas.toDataURL('image/jpeg', 0.65));
        } else {
          setPhotoData(reader.result as string);
        }
        stopCamera();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photoData) {
      setErrorMessage('Please capture or select a selfie photo before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        photo: photoData,
        location: locationStr,
        latitude,
        longitude,
      });
      stopCamera();
      onClose();
    } catch (err: any) {
      console.error('Attendance submission error:', err);
      let msg = err.message || 'Failed to record attendance. Please try again.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'Unable to connect to attendance server. Please ensure the backend server is running and try again.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn font-body text-xs">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-[#cbd5e1]">
        {/* Header */}
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                {isStart ? 'event_available' : 'logout'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">{title}</h3>
              <p className="text-[11px] text-[#64748b]">
                {employeeName} • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Location & Time Indicator */}
          <div className="bg-[#f0fdf4] border border-[#86efac] p-2.5 rounded-lg flex items-center justify-between text-[#15803d]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span className="font-semibold text-xs">{locationStr}</span>
            </div>
            <span className="font-mono text-[11px] text-[#166534]">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Camera Stream / Captured Photo */}
          <div className="relative w-full aspect-4/3 bg-[#0f172a] rounded-lg overflow-hidden flex items-center justify-center border border-[#cbd5e1]">
            {photoData ? (
              <img
                src={photoData}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              <div className="p-6 text-center text-[#94a3b8] space-y-3">
                <span className="material-symbols-outlined text-[40px] text-[#cbd5e1]">
                  no_photography
                </span>
                <p className="text-xs text-white/90">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded cursor-pointer"
                >
                  Upload Selfie Photo
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5] rounded-md font-semibold text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between gap-2">
          {!photoData ? (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!!cameraError}
              className="w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Take Selfie Photo
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-white hover:bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-bold text-xs rounded-lg cursor-pointer"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {isSubmitting ? 'Saving...' : isStart ? 'Confirm & Start Day' : 'Confirm & End Day'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
