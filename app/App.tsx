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

  const sendIntoChatKit = useCallback((text: string) => {
    // Scope the search to the ChatKit root container so
    // we don't pick up random WP textareas
    const root = document.getElementById("rcam-chat-root");

    if (!root) {
      console.warn("ChatKit root not found");
      return;
    }

    // Try a few sensible selectors
    const candidate =
      (root.querySelector(
        'textarea[placeholder*="Type or write your question here"]'
      ) as HTMLTextAreaElement | null) ||
      (root.querySelector(
        'textarea[placeholder*="Ask anything"]'
      ) as HTMLTextAreaElement | null) ||
      (root.querySelector("textarea") as HTMLTextAreaElement | null);

    if (!candidate) {
      // If the user clicks the mic before ChatKit finishes mounting,
      // we just bail out quietly.
      console.warn("ChatKit textarea not found");
      return;
    }

    const textarea = candidate;

    textarea.value = text;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
    });

    textarea.dispatchEvent(enterEvent);
  }, []);

  const { isRecording, isTranscribing, startRecording, stopRecording } =
    useWhisperRecorder(sendIntoChatKit);

  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      <div
        id="rcam-chat-root"
        className="mx-auto w-full max-w-5xl relative"
      >
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
