"use client";

import { useState, useRef, useCallback } from "react";

type UseWhisperRecorderReturn = {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

// Silence detection tuning
const SILENCE_THRESHOLD = 0.03; // bigger = more sensitive to noise
const SILENCE_DURATION_MS = 2000; // ms of quiet before auto-stop

export function useWhisperRecorder(
  onTranscription: (text: string) => void
): UseWhisperRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastNonSilentRef = useRef<number>(0);

  const cleanupAudioGraph = () => {
    try {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch {
      // ignore
    }
    sourceRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
  };

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
    cleanupAudioGraph();
  }, []);

  const startSilenceDetection = useCallback(
    (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      lastNonSilentRef.current = performance.now();

      const loop = () => {
        const analyserNode = analyserRef.current;
        const recorder = mediaRecorderRef.current;

        // If recorder is gone or stopped, bail
        if (!analyserNode || !recorder || recorder.state === "inactive") {
          return;
        }

        analyserNode.getByteTimeDomainData(data);

        // Simple RMS estimate
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = performance.now();

        if (rms > SILENCE_THRESHOLD) {
          lastNonSilentRef.current = now;
        } else if (now - lastNonSilentRef.current >= SILENCE_DURATION_MS) {
          // enough silence → auto-stop
          stopRecording();
          return;
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    },
    [stopRecording]
  );

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setIsRecording(true);

      // Build audio graph for silence detection
      const AudioCtx =
        window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      startSilenceDetection(analyser);

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // stop mic
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        cleanupAudioGraph();

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        if (!blob.size) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");

          const res = await fetch("/api/whisper", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            console.error("Whisper error:", await res.text());
            return;
          }

          const json = (await res.json()) as { text?: string };
          if (json.text) {
            onTranscription(json.text);
          }
        } catch (err: unknown) {
          console.error("Error transcribing audio:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
    } catch (err: unknown) {
      console.error("Mic permission or init error:", err);
      setIsRecording(false);
      cleanupAudioGraph();
    }
  }, [isRecording, isTranscribing, onTranscription, startSilenceDetection]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
}
