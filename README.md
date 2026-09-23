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

- Iteración 0: definición del proyecto y vínculo con GitHub. ✅
- Iteración 1: metodología investigada, ver [`docs/metodologia.md`](docs/metodologia.md). ✅
- Iteración 2: esqueleto del agente en Node, con repaso espaciado en código y conversación con IA. ✅ (la llamada real al modelo aún no se probó: falta API key)

## Cómo funciona una sesión

1. **Repaso** (hasta 3 preguntas de ítems vencidos, mezclando temas). Pregunta y corrección las hace el código: **0 tokens**.
2. **Tema nuevo** presentado en bloque desde `data/curriculum.json`: **0 tokens**.
3. **Conversación** de hasta 4 turnos con el modelo: es el **único** punto que gasta tokens (respuestas de máx. 200 tokens, historial de los últimos 6 mensajes).

Al final se imprime el consumo de tokens de la sesión.

## Uso

```bash
npm install
npm test
npm start -- --no-ai        # sin IA, no necesita API key
```

Para la conversación con IA, definí la API key en tu terminal (no se guarda en el repo):

```powershell
$env:ANTHROPIC_API_KEY = "tu-key"
npm start
```

Modelo por defecto: `claude-haiku-4-5` (cambiable con la variable `TUTOR_MODEL`).

## Estructura

- `src/scheduler.js`: repetición espaciada (1-3-7-14-30 días) e intercalado.
- `src/grading.js`: corrección de respuestas de vocabulario.
- `src/tutor.js` y `src/prompts.js`: llamada al modelo y prompt corto.
- `src/cli.js`: orquesta la sesión.
- `data/curriculum.json`: currículo inicial de 5 temas (ejemplo, nivel A1).
- `test/`: 12 pruebas, incluida una de integración de la sesión completa.

## Historial de iteraciones

Ver [`CONVERSACION.md`](CONVERSACION.md) y el historial de commits.
