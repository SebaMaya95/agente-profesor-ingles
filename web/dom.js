// Helper mínimo para armar DOM sin librerías. Los textos siempre entran como texto (nunca como HTML).

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "html") el.innerHTML = value; // solo para SVG propio (íconos y mascota)
    else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const clear = (el) => {
  el.replaceChildren();
  return el;
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
