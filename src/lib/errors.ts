const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials":   "Email ou senha incorretos.",
  "Email not confirmed":          "Email não confirmado. Verifique sua caixa de entrada.",
  "User already registered":      "Este email já está cadastrado.",
  "Password should be at least":  "A senha deve ter no mínimo 6 caracteres.",
  "rate limit":                   "Muitas tentativas. Aguarde alguns minutos.",
};

export function parseApiError(error: unknown): string {
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const msg = error.message;
    const match = Object.entries(ERROR_MESSAGES).find(([key]) =>
      msg.toLowerCase().includes(key.toLowerCase())
    );
    return match ? match[1] : msg;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
