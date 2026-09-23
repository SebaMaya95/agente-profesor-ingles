# Metodología del agente (investigación destilada)

Se investigó **una sola vez** y se resume acá. El agente no vuelve a investigar en cada sesión: el código aplica estas reglas y el modelo solo conversa y corrige.

## 1. Evidencia y decisión de diseño

| # | Hallazgo | Fuente | Decisión de diseño |
|---|----------|--------|--------------------|
| 1 | La práctica espaciada tiene efecto **medio-grande** en L2 (meta-análisis de 48 experimentos, 3.411 participantes). Espaciados más largos rinden más en pruebas diferidas. | [Kim & Webb 2022, *Language Learning*](https://onlinelibrary.wiley.com/doi/abs/10.1111/lang.12479) | Cada ítem se repasa espaciado en el tiempo, no de corrido. |
| 2 | Espaciado **expansivo vs. igual: equivalentes** en el conjunto de estudios (Nakata 2015 encontró una ventaja pequeña del expansivo). | Kim & Webb 2022 (mismo) | Usamos intervalos crecientes simples (1, 3, 7, 14, 30 días). No hace falta un algoritmo complejo. |
| 3 | **Recuperar de memoria** rinde más que volver a estudiar: g ≈ 0,50 sobre 159 estudios; 81% de las comparaciones a favor. | [Guía de effect sizes, RetrievalPractice.org](https://pdf.retrievalpractice.org/MetaAnalysisGuide.pdf) | Los repasos son preguntas para producir la respuesta, no relecturas. |
| 4 | **Intercalar** temas mejora la precisión gramatical en pruebas diferidas, aunque rinde peor durante la práctica. Para principiantes o alumnos de bajo nivel, conviene **empezar en bloque** y después intercalar (híbrido). | [Hwang 2025, *Language Learning*](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659); [Interleaved practice, Romance languages](https://www.sciencedirect.com/science/article/abs/pii/S0959475224001725) | Un tema nuevo se practica en bloque; los repasos posteriores mezclan temas anteriores. |
| 5 | La corrección **explícita** rinde más que la implícita (d = 0,64 global). En clase, los **prompts** (dar pistas para que el alumno se autocorrija) superan a los recasts (reformular). | [Li 2010](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-9922.2010.00561.x); [Lyster & Saito 2010](http://kazuyasaito.net/SSLA2010.pdf) | Ante un error: una pista breve y explícita para que el alumno corrija; si no puede, se da la forma correcta. |
| 6 | Las **2.000 palabras más frecuentes** cubren ~90% de textos narrativos. Para leer con comodidad hacen falta 95–98% de cobertura. | [Nation & Waring 1997](https://www.lextutor.ca/research/nation_waring_97.html); [Hu & Nation, réplica 2023](https://onlinelibrary.wiley.com/doi/10.1111/lang.12622) | El vocabulario se enseña por **frecuencia**, empezando por las palabras más comunes. |
| 7 | Combinar **input comprensible** (nivel i+1) con **output** significativo (hablar/escribir), en tareas repetidas y de baja presión. | [Resumen input/output](https://files.eric.ed.gov/fulltext/EJ1083691.pdf) (nivel de evidencia menor: revisión conceptual, no meta-análisis) | Cada sesión mezcla un texto corto comprensible y una tarea de producción. |

## 2. Sobre el "refuerzo intermitente" que planteó el alumno

La idea (retomar algo visto hace un rato, no de inmediato) corresponde en la literatura a **práctica espaciada con recuperación**, no al "refuerzo intermitente" del conductismo. Conclusión práctica: lo que importa es que haya un **hueco** entre exposición y repaso, y que el repaso obligue a recordar. La forma exacta de los intervalos (fijos o crecientes) importa poco.

## 3. Reglas que aplica el agente

1. **Sesiones cortas** (~10 min) y frecuentes, con un tema nuevo por sesión.
2. **Tema nuevo:** práctica en bloque, con ejemplos y producción del alumno.
3. **Repasos:** entre 2 y 3 preguntas de ítems viejos, elegidos por el código según la fecha de vencimiento (intervalos 1 → 3 → 7 → 14 → 30 días). Acierto sube de nivel; error vuelve al primer intervalo.
4. **Repasos mezclados:** desde el segundo repaso, los ítems se intercalan entre temas.
5. **Corrección:** pista explícita primero, respuesta correcta si no logra corregir.
6. *(reemplazada en la iteración 3)* La unidad ya no es la palabra suelta sino la **frase útil en una situación** (ver sección 4).
7. *(reemplazada en la iteración 3)* Prioridad a **hablar y escuchar**; la escritura no es objetivo (ver sección 4).

## 4. Actualización (iteración 3): el objetivo es hablar con fluidez

El alumno aclaró que el objetivo es **salir hablando**, no la gramática formal ni la escritura. Eso cambió el diseño.

| Hallazgo | Fuente | Decisión de diseño |
|----------|--------|--------------------|
| Practicar **frases hechas** (chunks) libera atención y se asocia a mayor fluidez oral. Nivel de evidencia moderado (estudios chicos). | [Frontiers 2022](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.949675/full) | La unidad de aprendizaje es la **frase útil**, agrupada por **situación** ("pedir en un café"). |
| Repetir una tarea oral mejora complejidad y precisión; en fluidez el efecto es más matizado. Repetir todo de golpe sería "un arma de doble filo" (solo se leyó el título). | [Meta-análisis 2025](https://sciencedirect.com/science/article/abs/pii/S0346251X25002787?via=ihub%3D); [SSLA](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/massed-task-repetition-is-a-doubleedged-sword-for-fluency-development/D28EDD7E3D0FA15630165538D706E80F) | Las frases se repiten **espaciadas** y con **tipos de ejercicio distintos**, no de corrido. |
| El **shadowing** (escuchar y repetir imitando) mejora fluidez y pronunciación. La revisión de 44 estudios señala problemas metodológicos. | [Revisión sistemática 2025](https://www.tandfonline.com/doi/full/10.1080/29984475.2025.2546827) | Ejercicio "Repetir en voz alta" desde el primer contacto con cada frase. |
| Agrupar palabras por **tema** es preferible a agruparlas por **significado parecido** (interferencia). Estudios recientes dan resultados mixtos. | [Tinkham 1997](https://journals.sagepub.com/doi/10.1191/026765897672376469) | Contenido nuevo agrupado por situación; los repasos se **mezclan** entre niveles. |
| La instrucción **explícita** rinde más que la implícita, y enseñar la forma dentro o fuera de la situación rinde parecido. El orden de adquisición de estructuras depende de saliencia, complejidad, regularidad, categoría y frecuencia. | [Norris & Ortega 2000](https://onlinelibrary.wiley.com/doi/abs/10.1111/0023-8333.00136); [Goldschneider & DeKeyser 2005](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.0023-8333.2005.00295.x) | Cada nivel trae una **nota de gramática** breve y explícita, atada a sus frases. Los niveles van de lo simple a lo complejo (ser/estar → presente → pasado). |
| La gamificación se asocia a mayor logro y motivación en idiomas, aunque algunos estudios no confirman que la motivación explique la mejora. | [Frontiers 2024](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1295709/full) | XP, racha, niveles que se desbloquean y coronas (ver abajo). |

### Diseño del juego

- **Niveles** = situaciones. Se **supera** un nivel al aprender el 80% de sus frases (2 aciertos cada una, en ejercicios distintos), lo que desbloquea el siguiente.
- **Coronas (0 a 3)** = dominio real. Suben solo cuando *todas* las frases del nivel se recuerdan tras repasos espaciados en días distintos. Así se avanza rápido, pero lo consolidado se premia y se obliga a repasar.
- **XP** solo por respuestas que el alumno produce; más XP por ejercicios más exigentes (hablar > elegir).
- **Escalera de dificultad** por frase: reconocer e imitar (frase nueva o fallada) → completar y ordenar → decir de memoria.
- **Role-play con IA** al superar cada nivel: es donde se practica conversar de verdad.

### Decisión de eficiencia: banco precargado vs. IA en cada pregunta

- **Precargado (0 tokens):** todas las frases, notas, errores típicos y ejercicios cerrados (elegir, completar, ordenar, detectar el error, escuchar, repetir, decir) se arman en código a partir del currículo, que se escribe y revisa una sola vez.
- **Azar controlado:** el azar solo mezcla opciones y elige el tipo de ejercicio. Qué frase toca lo decide el planificador de repasos; con selección puramente aleatoria se perdería el espaciado.
- **IA solo para el role-play:** con tope de turnos, respuestas cortas y modelo chico.
- **Corrección en código:** tolera pequeñas diferencias (típicas del reconocimiento de voz), pero exige la palabra clave y rechaza lo que se parece más al error típico que a la frase correcta.
- **Costo:** la personalización es menor (frases fijas), a cambio de corrección inmediata y consistente y costo casi nulo.

## 5. Límites de esta investigación

- Se basa en búsqueda web resumida, no en lectura completa de los artículos. Los números citados (g, d, tamaños de muestra) son los que reportan los resúmenes.
- La cita de Nakata 2015 se reproduce tal como la describe el resumen de Kim & Webb 2022.
- El punto 7 tiene respaldo más débil que los demás.
- Los intervalos 1-3-7-14-30 son una elección práctica razonable, no un valor óptimo probado.
- Las reglas de superación de nivel (2 aciertos por frase, 80% del nivel) y de XP son decisiones de diseño del juego, no valores respaldados por estudios.
- La **rotación de los tipos de ejercicio entre categorías** es un pedido del alumno (variedad de tareas); no se buscó evidencia específica sobre ella.
- La consigna guiada se corrige verificando la presencia de los elementos pedidos; no evalúa la corrección gramatical.
- Las frases y los "errores típicos" del currículo son de autoría propia (Claude), pendientes de revisión por el alumno, y no salen de un corpus de errores de hispanohablantes.
