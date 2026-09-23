// Íconos propios en SVG (viewBox 24). Se pintan con currentColor para seguir la paleta.
const svg = (body, extra = "") =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" ${extra}>${body}</svg>`;
const stroke = (body) =>
  svg(body, 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"');

export const icons = {
  flame: svg('<path d="M12 2c.8 3.6-3 5.2-3 9.2a3 3 0 0 0 6 0c0-1-.4-1.9-1-2.8 3 1.1 5 4 5 7.1a7 7 0 0 1-14 0C5 10 10 8 12 2z"/>'),
  star: svg('<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>'),
  crown: svg('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/>'),
  lock: svg('<path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1zm2 0h6V8a3 3 0 0 0-6 0v2z"/>'),
  check: stroke('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),
  mic: svg('<path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5zM18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-3.1A8 8 0 0 0 20 11h-2z"/>'),
  speaker: svg('<path d="M3 9.5v5h4l5 4v-13l-5 4H3zm13.5 2.5a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>'),
  path: svg('<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zm0 2.4l6 2v11.2l-6-2V5.4z"/>'),
  user: svg('<circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7H4z"/>'),
  chat: svg('<path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>'),
  play: svg('<path d="M7 4.5v15l13-7.5z"/>'),
  send: svg('<path d="M3 20.5l18-8.5L3 3.5v6.6l11 1.9-11 1.9z"/>'),
};

export const icon = (name) => icons[name];
