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
6. **Vocabulario por frecuencia:** currículo ordenado de las palabras más comunes a las menos comunes.
7. **Las cuatro habilidades** (escuchar, hablar, leer, escribir) se reparten en la sesión.

## 4. Límites de esta investigación

- Se basa en búsqueda web resumida, no en lectura completa de los artículos. Los números citados (g, d, tamaños de muestra) son los que reportan los resúmenes.
- La cita de Nakata 2015 se reproduce tal como la describe el resumen de Kim & Webb 2022.
- El punto 7 tiene respaldo más débil que los demás.
- Los intervalos 1-3-7-14-30 son una elección práctica razonable, no un valor óptimo probado.
