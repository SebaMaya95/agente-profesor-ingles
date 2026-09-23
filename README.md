# Agente Profesor de Inglés

Trabajo práctico de **Creación de Agentes de IA**.

## Objetivo

Un agente que enseñe a **hablar y entender inglés** lo más rápido posible (no tanto escritura ni gramática formal), con metodología respaldada por investigación y **extremadamente eficiente en tokens**. Se plantea como un juego: unidades por tema, lecciones, XP, racha y coronas. La mascota será un border collie animado.

## Principios de diseño

- **La pedagogía la decide el código, no el modelo.** El plan de repaso (repetición espaciada), los ejercicios y su corrección son determinísticos: **0 tokens**.
- **Banco de actividades precargado.** El vocabulario, los errores típicos, diálogos e historias se escriben y revisan una vez. El azar solo mezcla opciones y elige el tipo de ejercicio; qué ítem toca lo decide el planificador.
- **La IA solo para el role-play** de cada unidad (con tope de turnos, respuestas cortas y modelo chico).
- **Metodología investigada una sola vez**, en [`docs/metodologia.md`](docs/metodologia.md).
- **Contenido del alumno:** parte de su documento de vocabulario, tiempos verbales y ejercicios; ver [`docs/contenido.md`](docs/contenido.md).
- **Stack:** Node.js.

## Estado

- Iteración 0: definición del proyecto y vínculo con GitHub. ✅
- Iteración 1: metodología investigada. ✅
- Iteración 2: esqueleto con repaso espaciado y conversación con IA; primera prueba real con la API (costo medido: ~US$ 0,001 por sesión). ✅
- Iteración 3: enfoque en hablar; juego con XP, racha y coronas. ✅
- Iteración 3b: se incorpora el documento del alumno (5 tiempos, 12 categorías, 273 ítems). ✅
- Iteración 3c: los 9 tipos de ejercicio del documento (más 3 propios) implementados y rotando entre las 12 unidades, con 73 lecciones. ✅ (consola)
- Iteración 4: web de juego (Colly, mascota border collie) en gama del azul, con voz del navegador, los 12 ejercicios, mapa de unidades y role-play con IA; configuración para Vercel. ✅ (probada en local; el deploy en Vercel está pendiente)

## Cómo funciona una sesión

1. **Repaso** de ítems vencidos, mezclando unidades. Ejercicios y corrección en código.
2. **Lección actual:** en la primera de cada unidad se muestra la ficha del tiempo verbal; luego los ítems y la práctica, rotando los tipos de ejercicio, más 2 ejercicios de unidad (errores, diálogos, transformaciones, historias, consigna guiada).
3. **Role-play con IA** al superar todas las lecciones de la unidad: el único punto que gasta tokens.

Al final se muestra el mapa de unidades, el XP, la racha y los tokens usados.

### Los 12 tipos de ejercicio

Completar · Transformar la oración · Relacionar (palabras, y oraciones con conectores) · Detectar y corregir el error · Role-play con IA · Armar la frase · Completar el diálogo · Historia con opciones · Consigna guiada · Escuchar y elegir · Repetir en voz alta · Decir de memoria. En la consola, los de voz se escriben; en la web se hablarán.

## Contenido y privacidad

El contenido (`data/contenido/`) sale del documento del alumno. Como el repo es público, los datos personales se reemplazaron por marcadores (`{{name}}`, `{{father}}`...). Los valores reales van en `data/perfil.json` (local, ignorado por git); sin él se usa `data/perfil.ejemplo.json`.

## Web

Interfaz de juego con mapa de unidades, los 12 ejercicios, voz y role-play. Detalles, publicación en Vercel y límites en [`docs/web.md`](docs/web.md).

```bash
npm.cmd run web    # http://localhost:5173
```

## Uso en consola

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

- `src/activities.js`: generador y corrector de los 12 tipos de ejercicio.
- `src/game.js`: reglas del juego (lecciones, XP, racha, coronas, repasos y rotación de ejercicios).
- `src/curriculum.js`: arma las 12 unidades y 73 lecciones a partir del contenido.
- `src/contenido.js`: carga del contenido y del perfil del alumno.
- `src/scheduler.js`: repetición espaciada (1-3-7-14-30 días) e intercalado.
- `src/grading.js`: corrección tolerante (contracciones, palabra clave, error típico).
- `src/tutor.js` y `src/prompts.js`: role-play con el modelo.
- `src/cli.js`: sesión de consola (herramienta de prueba del motor).
- `src/roleplay-api.js` y `api/roleplay.js`: endpoint del role-play (API key solo en el servidor).
- `web/`: la interfaz (pantallas, ejercicios, voz, mascota, estilos); `index.html` en la raíz.
- `tools/serve.js`: servidor local para probar la web.
- `data/contenido/`: tiempos, vocabulario, unidades y material de ejercicios.
- `test/`: 77 pruebas del motor, del contenido, de la rotación, de la sesión web, del guardado y del endpoint.
