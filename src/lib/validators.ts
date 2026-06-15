const RIOT_ID_REGEX = /^.{3,16}#[A-Za-z0-9]{3,5}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function validateRiotId(value: string): string | null {
  if (!value) return null;
  if (!RIOT_ID_REGEX.test(value)) {
    return "Formato inválido. Use Nome#TAG (ex: Player#BR1, Gamer#1234)";
  }
  return null;
}

export function validateUsername(value: string): string | null {
  if (!value) return "Nome de usuário é obrigatório.";
  if (!USERNAME_REGEX.test(value)) {
    return "Use entre 3 e 20 caracteres. Apenas letras, números e _";
  }
  return null;
}

export function isValidRiotId(value: string): boolean {
  return RIOT_ID_REGEX.test(value);
}
