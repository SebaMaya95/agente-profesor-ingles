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

**Nota de proceso:** el antivirus (Avast) marcó como falso positivo la instalación de Git y `gh` por línea de comandos; se ignoró el aviso y la instalación se completó.
