"use client";

import { Camera, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { SecurityLevel } from "@/modules/exam";
import { Button } from "@/components/ui/button";

/** Request and hold camera permission for high-security sittings. */
export function CameraGate({
  security,
  children,
}: {
  security: SecurityLevel;
  children: React.ReactNode;
}) {
  const required = security === "high";
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const onEnded = () => {
      setStream(null);
      setError("Camera access ended. Allow camera access to continue.");
    };
    track.addEventListener("ended", onEnded);
    return () => {
      track.removeEventListener("ended", onEnded);
      stream.getTracks().forEach((item) => item.stop());
    };
  }, [stream]);

  if (!required || stream) return <>{children}</>;

  async function requestCamera() {
    setRequesting(true);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not available in this browser.");
      }
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStream(nextStream);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Camera permission was not granted.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section className="w-full max-w-md space-y-5 rounded-lg border border-rule bg-surface p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Camera className="size-5" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Allow camera access</h1>
          <p className="text-sm leading-6 text-ink-2">
            This high-security exam requires your browser camera permission before you can begin.
          </p>
        </div>
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
        <Button className="w-full" onClick={requestCamera} disabled={requesting}>
          {requesting ? <RefreshCw className="motion-safe:animate-spin" /> : <Camera />}
          {requesting ? "Requesting camera…" : "Allow camera"}
        </Button>
      </section>
    </main>
  );
}