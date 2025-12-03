// app/App.tsx
"use client";

import { useCallback } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useWhisperRecorder } from "@/components/useWhisperRecorder";

export default function App() {
  const { scheme, setScheme } = useColorScheme();

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  // For now, just log the transcription (or show it in your own UI)
  const handleTranscription = useCallback((text: string) => {
    console.log("Whisper transcription:", text);
    // TODO: show in your own UI / copy to clipboard / manual send button
  }, []);

  const { isRecording, isTranscribing, startRecording, stopRecording } =
    useWhisperRecorder(handleTranscription);

  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-5xl relative">
        <ChatKitPanel
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />

        {/* Floating mic button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className="fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-md text-sm"
          style={{
            background: "#0069b4",
            color: "#fff",
            opacity: isTranscribing ? 0.7 : 1,
          }}
        >
          {isTranscribing
            ? "Transcribing..."
            : isRecording
            ? "Stop"
            : "🎤 Talk / Hablar"}
        </button>
      </div>
    </main>
  );
}
