# Agente Profesor de Inglés

Trabajo práctico de **Creación de Agentes de IA**.

## Objetivo

Un agente que enseñe a **hablar y entender inglés** lo más rápido posible (no tanto escritura ni gramática formal), con metodología respaldada por investigación y **extremadamente eficiente en tokens**. Se plantea como un juego: niveles por situación, XP, racha y coronas.

## Principios de diseño

- **La pedagogía la decide el código, no el modelo.** El plan de repaso (repetición espaciada), los ejercicios y su corrección son determinísticos: **0 tokens**.
- **Banco de actividades precargado.** Las frases y los errores típicos se escriben y revisan una vez en `data/curriculum.json`. El azar solo mezcla opciones y elige el tipo de ejercicio; qué frase toca lo decide el planificador.
- **La IA solo para el role-play** de cada nivel (con tope de turnos, respuestas cortas y modelo chico).
- **Metodología investigada una sola vez**, en [`docs/metodologia.md`](docs/metodologia.md).
- **Stack:** Node.js.

## Estado

- Iteración 0: definición del proyecto y vínculo con GitHub. ✅
- Iteración 1: metodología investigada. ✅
- Iteración 2: esqueleto con repaso espaciado y conversación con IA; primera prueba real con la API (costo medido: ~US$ 0,001 por sesión). ✅
- Iteración 3: enfoque en hablar; niveles por situación, 6 tipos de ejercicio, XP, racha, coronas y role-play. ✅ (consola)
- Iteración 3b: se incorpora el documento del alumno (5 tiempos verbales, 12 categorías, 273 ítems, 9 tipos de ejercicio); ver [`docs/contenido.md`](docs/contenido.md). ✅ (contenido cargado; ejercicios nuevos pendientes)
- Iteración 4: interfaz web con voz, estilo juego en gama del azul, para publicar en Vercel (próxima).

## Contenido y privacidad

El contenido (`data/contenido/`) sale del documento del alumno. Como el repo es público, los datos personales se reemplazaron por marcadores (`{{name}}`, `{{father}}`...). Los valores reales van en `data/perfil.json` (local, ignorado por git); sin él se usa `data/perfil.ejemplo.json`.

## Cómo funciona una sesión

1. **Repaso** de frases vencidas, mezclando niveles. Ejercicios y corrección en código.
2. **Nivel actual:** nota de gramática, frases y práctica hasta superarlo (80% de las frases aprendidas).
3. **Role-play con IA** al superar el nivel: el único punto que gasta tokens.

Al final se muestra el mapa de niveles, el XP, la racha y los tokens usados.

### Tipos de ejercicio

Escuchar y elegir el significado · Detectar el error · Completar · Armar la frase · Repetir en voz alta (shadowing) · Decir la frase de memoria. En la consola, las de voz se escriben; en la web se hablarán.

## Uso

```bash
npm install
npm test
npm.cmd start -- --no-ai    # sin IA, no necesita API key
```

En Windows PowerShell conviene `npm.cmd` (si `npm` falla por la política de ejecución de scripts).

Para el role-play con IA, definí la API key en tu terminal (no se guarda en el repo):

```powershell
$env:ANTHROPIC_API_KEY = "tu-key"
npm.cmd start
```

Modelo por defecto: `claude-haiku-4-5` (cambiable con la variable `TUTOR_MODEL`).

## Estructura

- `src/game.js`: reglas del juego (niveles, XP, racha, coronas, repasos).
- `src/activities.js`: generador y corrector de los 6 tipos de ejercicio.
- `src/scheduler.js`: repetición espaciada (1-3-7-14-30 días) e intercalado.
- `src/grading.js`: corrección tolerante para lo dicho, con palabra clave y detección del error típico.
- `src/tutor.js` y `src/prompts.js`: role-play con el modelo.
- `src/cli.js`: sesión de consola (herramienta de prueba del motor).
- `data/curriculum.json`: 5 niveles (presentarte, café, rutina, direcciones, pasado), 6 frases cada uno.
- `test/`: pruebas del motor, del banco de actividades y de la sesión completa.
