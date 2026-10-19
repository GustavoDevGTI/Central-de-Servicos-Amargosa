export const ADMIN_PASSWORD_MIN = 6;
export const ADMIN_PASSWORD_MAX = 12;
export const ADMIN_PASSWORD_HINT = "A senha deve ter de 6 a 12 caracteres.";

/**
 * @param {unknown} password
 * @returns {password is string}
 */
export function isValidAdminPassword(password) {
  return typeof password === "string" && password.length >= ADMIN_PASSWORD_MIN && password.length <= ADMIN_PASSWORD_MAX;
}
