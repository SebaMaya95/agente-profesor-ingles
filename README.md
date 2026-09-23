# Agente Profesor de Inglés

Trabajo práctico de **Creación de Agentes de IA**.

## Objetivo

Un agente que enseñe a interactuar en inglés (escuchar, hablar, leer, escribir) lo más rápido posible, aplicando metodología con respaldo de investigación, y siendo **extremadamente eficiente en el uso de tokens**.

## Principios de diseño

- **La pedagogía la decide el código, no el modelo.** El plan de repaso (repetición espaciada, refuerzo intermitente) se calcula con un algoritmo determinístico. El modelo solo genera y corrige la interacción.
- **Metodología investigada una sola vez** y destilada en `docs/metodologia.md`. No se vuelve a investigar en cada sesión.
- **Tokens mínimos:** modelo chico (Haiku 4.5), prompts cortos, prompt caching, estado del alumno guardado localmente en JSON.
- **Stack:** Node.js.

## Estado

Iteración 0: definición del proyecto y vínculo con GitHub.

## Historial de iteraciones

Ver [`CONVERSACION.md`](CONVERSACION.md) y el historial de commits.
