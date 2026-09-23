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

## Iteración 3: enfoque en hablar, niveles tipo juego y banco de actividades

**Preguntas del alumno:** ¿dónde va la API key?; ¿la herramienta será web, app o ambas?; ¿se consideraron estructuras y tiempos verbales?; ¿debería ser un juego por niveles con premios?; ¿los bloques deben ser temáticos o salteados?; ¿se gastan tokens en cada pregunta o hay actividades precargadas?

**Respuestas y decisiones:**
- *API key:* variable de entorno en la terminal del alumno, nunca en el repo ni en el chat.
- *Web vs. app:* web en Vercel instalable (PWA). La voz (reconocimiento y síntesis del navegador) no consume tokens y funciona en Chrome, Edge y Safari.
- *Temático vs. salteado:* las dos cosas, en momentos distintos. Contenido nuevo agrupado por situación; repasos mezclados y espaciados.
- *Estructuras y tiempos verbales:* cada nivel trae una nota de gramática breve atada a sus frases, de lo simple a lo complejo.
- *Objetivo hablar:* la unidad pasa a ser la **frase útil** dentro de una situación, no la palabra suelta. Se agregaron a la metodología la evidencia sobre frases hechas, repetición de tareas orales, shadowing y gamificación.
- *Eficiencia de tokens:* **banco de actividades precargado**. Todo lo cerrado se genera y corrige en código (0 tokens); el azar solo mezcla opciones y elige el tipo de ejercicio, y el planificador decide qué frase toca. La IA se usa únicamente en el role-play de cada nivel.
- *Estética pedida:* estilo "juego" (botones gruesos con relieve, colores intensos, ese tipo de interacción) en **gama del azul**, con personaje y elementos propios, sin copiar la marca ni los recursos de otra app. Se implementa en la iteración 4.

**Qué se construyó:**
- Currículo v2: 5 niveles por situación (presentarte, café, rutina, direcciones, pasado), 6 frases cada uno, con palabra clave y error típico de hispanohablantes.
- 6 tipos de ejercicio: escuchar y elegir, detectar el error, completar, armar la frase, repetir en voz alta, decir de memoria.
- Juego: XP, racha diaria, niveles que se desbloquean (80% de las frases con 2 aciertos), coronas por repasos espaciados y role-play con IA al superar el nivel.
- Corrección tolerante para lo dicho, que exige la palabra clave y rechaza lo que se parece más al error típico (por ejemplo, "She live in Rosario").

**Resultado:** 30 pruebas automáticas pasan. Incluyen un alumno "bot" que juega niveles completos, y la verificación de que todas las actividades de todas las frases se generan y corrigen bien.

**Límites declarados:**
- Las frases, notas y errores típicos son de autoría de Claude y están pendientes de revisión por el alumno.
- Las reglas de superación de nivel y de XP son decisiones de diseño, no valores respaldados por estudios.
- Todavía no hay interfaz visual ni voz: la consola es una herramienta de prueba del motor.
- El ajuste de prompt para el role-play nuevo (escena por nivel) no se probó aún con la API.

## Iteración 3b: se incorpora el documento "Vocabulario"

**Pedido del alumno:** agregó a la carpeta un documento con los tiempos verbales, las categorías de vocabulario y 9 tipos de ejercicio, y pidió usarlos como base del curso, pudiendo sumar más vocabulario y actividades.

**Qué se hizo:**
- Se leyó el documento completo y se convirtió a datos: 5 tiempos verbales (`data/contenido/tiempos.json`) y 12 categorías con 273 ítems (`data/contenido/vocabulario.json`). El conteo por categoría se verificó contra el documento.
- Se mapearon los 9 ejercicios contra lo ya construido: 3 ya existían (completar, ordenar, role-play), 1 existía parcialmente (detectar errores) y 5 son nuevos (transformar oraciones, relacionar conectores, completar diálogos, historias con opciones, redacción guiada). Detalle en [`docs/contenido.md`](docs/contenido.md).
- Se propuso cómo asignar tiempos verbales a las 12 categorías para armar los niveles (borrador a validar).

**Privacidad (decisión importante):** el documento contenía datos personales del alumno (nombres de familiares y mascotas, edad, fecha de nacimiento, lugar de residencia, medidas) y el repositorio es público. Antes de hacer nada se verificó que el documento **no** estaba en el repo ni en su historial. Luego:
- Se agregó `*.docx` y `data/perfil.json` al `.gitignore`.
- Los datos personales se reemplazaron por marcadores (`{{name}}`, `{{father}}`...) y los valores reales quedaron en un perfil local que no se sube. Con eso el curso puede hablar de la vida del propio alumno sin exponerla.
- Se agregó una prueba automática que falla si algún dato del perfil local aparece en un archivo versionado.

**Problemas encontrados:**
- El conversor reemplazó "Ana" (nombre de la abuela) dentro de la palabra "Analytical", y eso rompió la lectura de un grupo. Se corrigió para que solo reemplace palabras completas y se verificó el resultado.
- Varios comandos de PowerShell con texto multilínea se colgaron en este entorno; se resolvió escribiendo los scripts como archivos.

**Resultado:** 35 pruebas automáticas pasan.

**Límites declarados:**
- Solo se neutralizaron los datos personales identificables; el contenido profesional (trabajo, estudios) y los gustos quedaron tal cual.
- Falta la traducción de las oraciones de ejemplo y los errores típicos por oración, que el documento no trae.
- Los 5 ejercicios nuevos todavía no están implementados.

## Iteración 3c: los 9 ejercicios del documento, rotando entre las 12 categorías

**Pedidos del alumno:** que todos los tipos de ejercicio **roten con las categorías de vocabulario**; que la mascota sea un **perro border collie animado**; y, sobre la asignación de tiempos verbales por categoría, "está ok, avanza".

**Qué se construyó:**
- Los **9 ejercicios del documento** más 3 propios por el foco en hablar (escuchar y elegir, repetir en voz alta, decir de memoria): 12 tipos. Seis se generan a partir de cada palabra o frase del vocabulario; cinco usan material escrito por unidad (errores típicos, transformaciones afirmativa/negativa/pregunta, diálogos con un turno faltante, historias con opciones, consigna guiada); el role-play sigue siendo el único que usa IA.
- **Contenido nuevo** (`unidades.json`, `actividades.json`): 36 errores típicos, 24 transformaciones, 24 diálogos, 12 historias, 12 consignas guiadas y 12 escenas de role-play.
- **Curso rearmado:** 12 unidades (una por categoría) y 73 lecciones de hasta 6 ítems. Al empezar cada unidad se muestra la ficha de su tiempo verbal. Reemplaza al currículo de 5 niveles anterior.
- **Rotación:** cada lección arranca la rotación de tipos en un punto distinto y nunca repite el mismo tipo seguido; los ejercicios de unidad rotan entre lecciones y cada unidad arranca en un tipo distinto. Cuando se agota el material nuevo de un ejercicio, se repite en un escalón más exigente (por ejemplo, de "elegir la correcta" a "escribirla bien").
- La corrección ahora entiende contracciones ("doesn't" = "does not") para poder corregir las transformaciones.

**Problemas encontrados y cómo se resolvieron** (las pruebas automáticas y la revisión de ejemplos reales los detectaron):
- *Bug real:* una historia con 2 respuestas buenas de 3 no aprobaba, porque el umbral era 0,67 y 2/3 es 0,666. Se cambió por aritmética entera.
- *"Completar" casi no aplicaba* en algunas unidades (5 de 15 ítems en Información personal, 3 de 11 en Trabajo) porque exigía que la palabra del ítem estuviera en su oración. Sin arreglo, ese ejercicio no rotaría en esas categorías. Se agregó una alternativa que tapa otra palabra de contenido de la oración.
- *Calidad de ejemplos:* al revisar una sesión real aparecieron "completar" con la oración entera tapada (ítems que son frases sueltas) y opciones con mayúsculas inconsistentes (`data Analyst`). Se corrigieron.
- *Diseño:* las opciones falsas de "relacionar" y "escuchar" salían de lecciones que el alumno todavía no había visto. Ahora salen solo de lo ya visto, con un mínimo de 8 ítems.
- *Hueco detectado al repasar el documento:* escribí los pares de oraciones para "relacionar oraciones y conectores" pero ningún ejercicio los usaba. Se conectó a la unidad de conectores.
- *Prueba mal armada:* asumí que un ejercicio de unidad subía de escalón en su segunda aparición; en realidad usa primero material nuevo. El diseño es el correcto y se corrigió la prueba.

**Resultado:** 58 pruebas automáticas pasan. Incluyen un alumno "bot" que juega cada una de las 12 unidades completas y verifica que aparecen los 11 tipos de ejercicio que no usan IA, y otra que verifica que las opciones falsas solo salen de lo ya visto.

**Límites declarados:**
- El material de ejercicios y las consignas guiadas lo escribió Claude; falta la revisión del alumno.
- La consigna guiada verifica que estén los elementos pedidos, no que la gramática sea correcta.
- La rotación de tipos entre categorías es un pedido del alumno; no se buscó evidencia específica sobre ella.
- Siguen sin traducción 8 ítems del documento (por ejemplo, *Power BI*).
- Todavía no hay interfaz visual ni voz: la consola es una herramienta de prueba. Es el objetivo de la iteración 4 (web con voz, estilo juego en gama del azul y mascota border collie).
