// Client-safe AI Types and Model Constants

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: string;
  roleDescription: string;
}

export const SUPPORTED_MODELS: AIModelOption[] = [
  {
    id: "google/gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "Google",
    roleDescription: "Default Fast & Economical Engine",
  },
  {
    id: "google/gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "Google",
    roleDescription: "Multimodal & Complex Logic",
  },
  {
    id: "deepseek/deepseek-v4-pro-0813",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    roleDescription: "Deep Analytics & Inventory Reconciliation",
  },
  {
    id: "qwen/qwen3.7-plus",
    name: "Qwen 3.7 Plus",
    provider: "Alibaba Cloud",
    roleDescription: "Bilingual ID/EN & Factory Slang",
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "OpenAI",
    roleDescription: "Generative CAD & Creative Insole Design",
  },
];
