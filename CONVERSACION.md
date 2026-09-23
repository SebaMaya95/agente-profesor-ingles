# Registro de la conversación e iteraciones

Resumen de lo relevante de la conversación con Claude durante la construcción del agente. Se actualiza en cada iteración.

## Iteración 0: definición y vínculo con GitHub

**Pedido inicial del alumno:** crear un agente para la materia, con el código versionado en GitHub para mostrar las iteraciones, y un `.md` final con lo relevante de la conversación.

**Decisión sobre GitHub:** el código se escribe local y se sube con un commit por iteración (no se adjuntan archivos sueltos al final). Así el historial de commits muestra la evolución. Herramientas: Git + GitHub CLI (`gh`), con login por navegador hecho por el alumno.

**Ideas evaluadas:**
1. Profesor de inglés basado en metodología actual (repetición espaciada, refuerzo intermitente, etc.).
2. Analista semanal del mercado agropecuario argentino (medios, tweets, estimaciones).

**Decisión: agente 1 (profesor de inglés).** Motivos:
- El agente de agro requiere scraping de medios y lectura de tweets; es lo que más tokens consume y la API de X es paga y frágil.
- El tutor no necesita internet en cada uso, así que es más fácil de hacer eficiente.

**Restricción clave del alumno:** no hacer algo complejo, sino algo extremadamente eficiente en tokens que llegue a buen puerto.

**Decisiones de diseño para cuidar tokens:**
- El plan de repaso lo calcula el código; el modelo solo conversa y corrige.
- Investigación de metodología una sola vez, destilada en un archivo.
- Modelo chico, prompts cortos, prompt caching.
- Stack Node.js (ya instalado; el lenguaje no cambia el costo en tokens).

**Vínculo con GitHub:** repo creado por el asistente con `gh` en la cuenta del alumno, inicialmente privado y luego pasado a público a pedido del alumno para que el profesor lo vea.

**Nota de proceso:** el antivirus (Avast) marcó como falso positivo la instalación de Git y `gh` por línea de comandos; se ignoró el aviso y la instalación se completó.

## Iteración 1: investigación de metodología

**Pedido del alumno:** investigar las últimas tendencias y papers de metodología y ver qué da más resultado. Ejemplo propuesto: refuerzos intermitentes, es decir, preguntar más tarde (no de inmediato) sobre algo visto antes.

**Qué se hizo:** búsqueda en literatura (meta-análisis de práctica espaciada, recuperación, intercalado, corrección de errores, cobertura de vocabulario) y destilado en [`docs/metodologia.md`](docs/metodologia.md).

**Hallazgos que cambiaron el diseño:**
- La idea del alumno está respaldada, pero con otro nombre: **práctica espaciada con recuperación**. Lo que importa es el hueco entre exposición y repaso y que el repaso obligue a recordar.
- Espaciado con intervalos crecientes vs. iguales: **equivalentes** en el meta-análisis (Kim & Webb 2022). Se usa un esquema simple (1-3-7-14-30 días) en vez de un algoritmo complejo, lo que además ahorra tokens.
- Corrección: pista explícita para que el alumno se autocorrija (prompts) rinde más que reformular (recasts).
- Intercalar temas rinde mejor a largo plazo, pero para principiantes conviene empezar en bloque.
- Vocabulario ordenado por frecuencia: las 2.000 palabras más comunes cubren ~90% de textos narrativos.

**Límite declarado:** la investigación se basó en resúmenes de búsqueda web, no en lectura completa de los artículos.

## Iteración 2: esqueleto del agente en Node

**Pedido del alumno:** avanzar con el agente, priorizando eficiencia en tokens.

**Decisión de arquitectura:** el modelo solo se usa para la conversación libre. Todo lo demás lo hace el código:
- Repaso espaciado (intervalos 1-3-7-14-30 días, intercalado de temas): `src/scheduler.js`.
- Preguntas de repaso y corrección de vocabulario: `src/grading.js`. Cuesta 0 tokens.
- Presentación del tema nuevo desde un JSON: 0 tokens.
- Conversación: prompt de sistema corto, respuestas de máximo 200 tokens, historial recortado a 6 mensajes, modelo `claude-haiku-4-5`, y contador de tokens por sesión.

**Problemas encontrados y cómo se resolvieron:**
- *Bug de entrada:* con `readline`, las líneas que llegan antes de hacer la pregunta se perdían, y un fin de entrada (Ctrl+D) dejaba el programa colgado sin guardar el progreso. Se reemplazó por una cola de líneas que devuelve `null` al cerrarse la entrada, y el programa guarda y termina.
- *Prueba mal armada:* el primer test de integración falló porque la respuesta simulada del tercer repaso era incorrecta (error del test, no del programa). Se corrigió el test.
- Para que las pruebas no pisen el progreso real del alumno, la ruta del archivo de estado se puede cambiar con la variable `ALUMNO_FILE`.

**Resultado:** 12 pruebas automáticas pasan, incluida una que simula dos sesiones completas (presentación, repaso con aciertos y errores, guardado).

**Límites declarados:**
- La llamada real al modelo (`src/tutor.js`) **no se probó** porque no había API key. Se probó todo el resto sin IA (`--no-ai`).
- No se activó prompt caching: el prompt de sistema es corto y, por debajo del mínimo cacheable del modelo, el caching no se activaría. Se medirá con el contador de tokens cuando haya API key.
- El currículo (5 temas, 25 palabras) es de ejemplo y no proviene de una lista de frecuencia real.

## Iteración 2b: primera prueba real con la API

**Cómo se probó:** el alumno cargó su API key como variable de entorno en su propia terminal (la key nunca pasó por el chat ni por el repo) y corrió `npm.cmd start`. En Windows, `npm start` falló por la política de ejecución de scripts de PowerShell (`npm.ps1` bloqueado); se resolvió llamando a `npm.cmd`, sin cambiar configuración del sistema.

**Resultado de la conversación:** el alumno escribió `Me name is Seba` a propósito. El tutor respondió con una pista en español (`Me → My`) sin dar la frase completa, y tras la corrección pasó a otra práctica. Esto cumple la regla de corrección de la metodología (pista explícita primero).

**Consumo medido:** 537 tokens de entrada y 81 de salida en 3 llamadas (~180 de entrada y ~27 de salida por llamada). Con las tarifas de `claude-haiku-4-5` ($1 / $5 por millón de tokens), la sesión costó cerca de **US$ 0,001**. Como cada llamada usa muy pocos tokens, el prompt caching no aplica.

**Problemas observados y ajustes:**
- La cuarta llamada falló con `Request timed out` y la sesión terminó, perdiendo ese turno. Ahora hay timeout de 30 s, mensajes de error claros (timeout / sin conexión) y se puede reintentar con Enter sin perder lo escrito. La causa del timeout no se investigó; no se sabe si fue la red.
- El tutor usaba emojis, asteriscos y se inventó un nombre ("My name is Teacher"). Se agregó al prompt: texto plano, sin emojis ni markdown, y sin inventar nombre. Esto también prepara el terreno para voz sintetizada. **Este ajuste de prompt aún no se volvió a probar con la API.**

**Cambio de enfoque pedido por el alumno:** el objetivo es hablar con fluidez, no la escritura ni la gramática formal. Se investigó y se resume en la iteración 3 (frases útiles, repetición espaciada de tareas orales, shadowing, y una versión web con voz).
