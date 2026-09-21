/**
 * Gerenciamento de access token em memória.
 * Nunca persista o token em localStorage, sessionStorage ou cookies.
 * O refresh token é mantido pelo backend via cookie HttpOnly.
 */

let _accessToken: string | null = null;

/** Retorna o access token atual (memória da aba, nunca armazenamento persistido). */
export function getAccessToken(): string | null {
  return _accessToken;
}

/** Armazena o access token em memória após login ou refresh bem-sucedido. */
export function setAccessToken(token: string): void {
  _accessToken = token;
}

/** Remove o access token da memória (logout ou refresh inválido). */
export function clearAccessToken(): void {
  _accessToken = null;
}
