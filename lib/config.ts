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
  "Hola, soy el asistente de RecursosCAM. / Hi, I’m the RecursosCAM assistant. Ask me your question about social, legal, or financial services and I will look for options that match your situation.";

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

  // Add this block to remove bold styling
  startScreen: {
    header: {
      fontWeight: 400 // normal weight
    }
  }
});
