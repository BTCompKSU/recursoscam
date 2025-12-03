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

  // Push transcribed text into ChatKit and "press Enter"
  const sendIntoChatKit = useCallback((text: string) => {
    const attemptSend = (attempt: number) => {
      const doc = document;

      const el =
        (doc.querySelector(
          '[placeholder*="Type or write your question here"]'
        ) as HTMLInputElement | HTMLTextAreaElement | null) ||
        (doc.querySelector(
          '[placeholder*="Ask anything"]'
        ) as HTMLInputElement | HTMLTextAreaElement | null) ||
        (doc.querySelector("textarea") as HTMLTextAreaElement | null) ||
        (doc.querySelector('input[type="text"]') as HTMLInputElement | null) ||
        (doc.querySelector('[contenteditable="true"]') as HTMLElement | null);

      // If the input is not ready yet, retry a few times with a short delay
      if (!el) {
        if (attempt < 10) {
          setTimeout(() => attemptSend(attempt + 1), 100);
        }
        return;
      }

      // Set the value depending on element type
      if ("value" in el) {
        (el as HTMLInputElement | HTMLTextAreaElement).value = text;
      } else {
        el.textContent = text;
      }

      // Trigger React's change handling
      el.dispatchEvent(new Event("input", { bubbles: true }));

      // Simulate pressing Enter to send the message
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
      });
      el.dispatchEvent(enterEvent);
    };

    // Kick off the first attempt immediately
    attemptSend(0);
  }, []);

  const { isRecording, isTranscribing, startRecording, stopRecording } =
    useWhisperRecorder(sendIntoChatKit);

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
