// app/api/whisper/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure we’re on the Node runtime for file handling
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Our hook sends field name "file"
    // but we also gracefully accept "audio" if that ever changes
    const file =
      (formData.get("file") || formData.get("audio")) as File | null;

    if (!file) {
      // Helpful logging for debugging
      console.error(
        "Whisper route: no file found. FormData keys:",
        Array.from(formData.keys())
      );
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // New OpenAI client supports File directly
    const transcription = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe", // or "whisper-1" if you prefer
      file,
    });

    return NextResponse.json({ text: transcription.text ?? "" });
  } catch (err) {
    console.error("Whisper route error:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
