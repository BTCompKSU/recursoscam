// src/components/useWhisperRecorder.ts
"use client";

import { useState, useRef, useCallback } from "react";

type UseWhisperRecorderReturn = {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

export function useWhisperRecorder(
  onTranscription: (text: string) => void
): UseWhisperRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const silenceStartRef = useRef<number | null>(null);

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
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    cleanupAudioGraph();
  }, []);

  const startSilenceDetection = (stream: MediaStream) => {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const SILENCE_THRESHOLD = 0.01;   // adjust if needed
    const SILENCE_MS = 3000;          // 3 seconds of silence

    const loop = (time: number) => {
      if (!analyserRef.current || !isRecording) return;

      analyserRef.current.getByteTimeDomainData(data);

      // Simple RMS estimate
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      if (rms < SILENCE_THRESHOLD) {
        if (silenceStartRef.current == null) {
          silenceStartRef.current = time;
        } else if (time - silenceStartRef.current >= SILENCE_MS) {
          // Enough silence: auto-stop
          stopRecording();
          silenceStartRef.current = null;
          return;
        }
      } else {
        silenceStartRef.current = null;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  };

  const startRecording = useCallback(async () => {
    if (isRecording) {
      // safety: if already recording, stop instead
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setIsRecording(true);

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cleanupAudioGraph();

        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        audioChunksRef.current = [];

        if (!blob.size) return;

        try {
          setIsTranscribing(true);
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
        } catch (err) {
          console.error("Error transcribing audio:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      startSilenceDetection(stream);
    } catch (err) {
      console.error("Mic permission or init error:", err);
      setIsRecording(false);
    }
  }, [isRecording, stopRecording, onTranscription]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
}
