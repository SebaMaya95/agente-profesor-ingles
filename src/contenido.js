// Utilidades de contenido que corren igual en Node y en el navegador.

// Reemplaza {{clave}} por el valor del perfil.
export const fill = (text, perfil) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in perfil)) throw new Error(`Falta "${key}" en el perfil`);
    return perfil[key];
  });

// Aplica fill a todos los textos de una estructura de datos.
export function deepFill(value, perfil) {
  if (typeof value === "string") return fill(value, perfil);
  if (Array.isArray(value)) return value.map((v) => deepFill(v, perfil));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepFill(v, perfil)]));
  }
  return value;
}
