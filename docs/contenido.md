# Contenido del curso (a partir de `Vocabulario.docx`)

El alumno armó un documento con los **tiempos verbales**, las **categorías de vocabulario** y **9 tipos de ejercicio**. Ese material es la base del curso; se puede ampliar con más vocabulario y actividades.

## Qué se incorporó

| Archivo | Contenido |
|---|---|
| `data/contenido/tiempos.json` | 5 tiempos con usos, claves y estructuras (afirmativa, negativa, interrogativa): Presente Simple, Presente Continuo, Pasado Simple, Futuro con *will*, Futuro con *going to*. |
| `data/contenido/vocabulario.json` | 12 categorías, 273 ítems (palabra, traducción y oración de ejemplo), agrupados como en el documento. |
| `data/contenido/unidades.json` | Una unidad por categoría: situación, tiempos que practica, escena del role-play y consigna guiada. |
| `data/contenido/actividades.json` | Material de ejercicios por unidad: 36 errores típicos, 24 transformaciones, 24 diálogos, 12 historias con opciones y 2 sets de oraciones para relacionar. |

Las 12 categorías: Información personal · Familia y relaciones · Compras y vida diaria · Trabajo y estudios · Pasatiempos · Clima · Emociones · Transporte y direcciones · Salud y bienestar · Ropa · Conectores y gramática · Expresiones comunes y cortesía.

## Privacidad: el repo es público

El documento original tiene datos personales del alumno (nombres de familiares y mascotas, edad, fecha de nacimiento, lugar de residencia, medidas). Por eso:

- `Vocabulario.docx` **no se sube** (`.gitignore`) y nunca fue parte del historial.
- En los archivos versionados, esos datos se reemplazaron por marcadores como `{{name}}` o `{{father}}`.
- Los valores reales viven en `data/perfil.json`, que **tampoco se sube**. Si no existe, se usa `data/perfil.ejemplo.json` (genérico).
- El curso usa la información **del propio alumno** (hablar de uno mismo es lo más útil para fluir), sin exponerla públicamente.
- Una prueba automática verifica que ningún dato del perfil local aparezca en los archivos versionados.
- Se dejó tal cual el contenido profesional y de gustos (trabajo, estudios, hobbies) por ser de baja sensibilidad.

## Cómo se arma el curso

**12 unidades, 73 lecciones.** Cada unidad es una categoría, y cada grupo del documento se divide en lecciones de hasta 6 ítems. El camino es lineal: superar una lección desbloquea la siguiente.

Tiempo verbal en foco por unidad (asignación aprobada por el alumno):

| Unidad | Categoría | Tiempo en foco |
|---|---|---|
| 1 | Información personal | Presente Simple |
| 2 | Familia y relaciones | Presente Simple |
| 3 | Compras y vida diaria | Presente Simple |
| 4 | Trabajo y estudios | Presente Simple |
| 5 | Pasatiempos | Presente Simple y Continuo |
| 6 | Clima | Presente Continuo y *going to* |
| 7 | Emociones | Presente Continuo |
| 8 | Transporte y direcciones | *Going to* |
| 9 | Salud y bienestar | Pasado Simple |
| 10 | Ropa | Presente Continuo |
| 11 | Conectores | Pasado Simple y *will* |
| 12 | Expresiones y cortesía | *Will* |

Al empezar cada unidad se muestra la ficha del tiempo verbal (usos, claves y estructuras).

## Los 9 tipos de ejercicio del documento en el motor

Todos están implementados y probados. Además se sumaron 3 ejercicios propios por el objetivo de hablar, para un total de **12 tipos**.

| # | Ejercicio del documento | Cómo funciona | Tokens |
|---|---|---|---|
| 1 | Fill in the Blanks | **Completar**: se tapa una palabra de la oración de ejemplo y se elige entre 3. | 0 |
| 2 | Sentence Transformation | **Transformar la oración**: pasar de afirmativa a negativa o pregunta (y a la inversa). Acepta "doesn't" o "does not". | 0 |
| 3 | Sentence Matching | **Relacionar**: unir palabras con su significado; en la unidad de conectores, unir el comienzo de cada oración con su final. | 0 |
| 4 | Error Detection and Correction | **Detectar y corregir**: primero elegir la oración correcta; al repetirse, escribirla o decirla bien. | 0 |
| 5 | Role Play | **Role-play con IA** al superar cada unidad, con una escena propia de la categoría. | Sí, con tope |
| 6 | Word Scramble | **Armar la frase** con las palabras desordenadas. | 0 |
| 7 | Dialogue Completion | **Completar el diálogo**: elegir el turno que falta; al repetirse, decirlo o escribirlo. | 0 |
| 8 | Choose Your Own Story | **Historia con opciones**: cada respuesta lleva a la siguiente escena; se aprueba con 2 de cada 3 buenas. | 0 |
| 9 | Guided Writing | **Consigna guiada**: se pide algo concreto (por ejemplo, presentarte) y el código verifica los elementos pedidos. Se puede **decir o escribir**. | 0 |
| propio | — | **Escuchar y elegir** el significado | 0 |
| propio | — | **Repetir en voz alta** (shadowing) | 0 |
| propio | — | **Decir la palabra o frase** de memoria | 0 |

## Rotación de los ejercicios con las categorías

- **Ejercicios de ítem** (completar, relacionar, armar la frase, escuchar, repetir, decir): rotan en cada lección. La rotación arranca en un punto distinto según la lección, nunca se repite el mismo tipo seguido, y el tipo permitido sube de dificultad con lo que el alumno ya domina (reconocer e imitar → producir de memoria).
- **Ejercicios de unidad** (errores, diálogos, transformaciones, historia, consigna guiada): cada lección suma 2, y la rotación arranca en un tipo distinto en cada unidad. Se usa primero el material nuevo; cuando se agota, el ejercicio se repite en su escalón más exigente.
- **Opciones falsas:** salen solo de lo que el alumno ya vio en la unidad, con un mínimo de 8 ítems para que siempre haya alternativas.
- Una prueba automática juega cada una de las 12 unidades como alumno perfecto y verifica que aparecen los 11 tipos que no usan IA.

## Pendientes conocidos

- **Revisión del alumno:** el material de `actividades.json` (errores típicos, transformaciones, diálogos, historias) y las consignas guiadas lo escribió Claude y falta que el alumno lo revise.
- **8 ítems sin traducción** en el documento (por ejemplo, *Power BI*, *Rock*, *Reggaeton*): no participan de los ejercicios de significado.
- **"Completar" alternativo:** cuando la palabra del ítem no está en su oración de ejemplo, se tapa otra palabra de contenido de la oración. Puede quedar alguna opción ambigua; conviene detectar casos con el uso.
- **La consigna guiada verifica que estén los elementos pedidos, no que la gramática sea correcta.** Una devolución con IA (opcional y con tope) no está implementada.
- Los ejercicios de voz (repetir, decir) se escriben en la consola; en la web se hablarán con el reconocimiento de voz del navegador.
