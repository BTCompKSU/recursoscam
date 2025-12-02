import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit";

export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

// Starter buttons that show on the empty screen
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Social services / Servicios sociales",
    prompt: "I am in need help finding social services.",
    icon: "circle-question",
  },
  {
    label: "Legal help / Ayuda legal",
    prompt: "I need legal help related to migration.",
    icon: "circle-question",
  },
  {
    label: "Financial help / Ayuda financiera",
    prompt: "I need information about financial or economic support.",
    icon: "circle-question",
  },
];

// Text in the input box before the user types
export const PLACEHOLDER_INPUT =
  "Type or write your question here / Escribe tu pregunta aquí…";

// Big heading text at the top of the empty chat
export const GREETING =
  "Welcome! / ¡Bienvenido! -- How can I be of service today? ¿Cómo puedo ser útil hoy?";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
});

