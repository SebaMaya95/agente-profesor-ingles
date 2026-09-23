# Contenido del curso (a partir de `Vocabulario.docx`)

El alumno armó un documento con los **tiempos verbales**, las **categorías de vocabulario** y **9 tipos de ejercicio**. Ese material es la base del curso; se puede ampliar con más vocabulario y actividades.

## Qué se incorporó

| Parte del documento | Archivo | Contenido |
|---|---|---|
| Tiempos verbales | `data/contenido/tiempos.json` | 5 tiempos con usos, claves y estructuras (afirmativa, negativa, interrogativa): Presente Simple, Presente Continuo, Pasado Simple, Futuro con *will*, Futuro con *going to*. |
| Categorías de vocabulario | `data/contenido/vocabulario.json` | 12 categorías, 273 ítems (palabra, traducción y oración de ejemplo), agrupados como en el documento. |
| 9 tipos de ejercicio | (ver tabla abajo) | Se implementan en el motor, uno por uno. |

Las 12 categorías: Información personal · Familia y relaciones · Compras y vida diaria · Trabajo y estudios · Pasatiempos · Clima · Emociones · Transporte y direcciones · Salud y bienestar · Ropa · Conectores y gramática · Expresiones comunes y cortesía.

## Privacidad: el repo es público

El documento original tiene datos personales del alumno (nombres de familiares y mascotas, edad, fecha de nacimiento, lugar de residencia, medidas). Por eso:

- `Vocabulario.docx` **no se sube** (está en `.gitignore`) y nunca fue parte del historial.
- En los archivos versionados, esos datos se reemplazaron por marcadores como `{{name}}` o `{{father}}` (por ejemplo: "My name is {{name}}.").
- Los valores reales viven en `data/perfil.json`, que **tampoco se sube**. Si no existe, se usa `data/perfil.ejemplo.json` (genérico).
- Resultado: el curso usa la información **del propio alumno** (hablar de uno mismo es lo más útil para fluir), sin exponerla públicamente.
- Una prueba automática verifica que ningún dato del perfil local aparezca en los archivos versionados.
- Se dejó tal cual el contenido profesional y de gustos (trabajo, estudios, hobbies) por ser de baja sensibilidad; se puede neutralizar también si se prefiere.

## Los 9 tipos de ejercicio del documento frente al motor

| # | Ejercicio del documento | Estado | Cómo se resuelve | Tokens |
|---|---|---|---|---|
| 1 | Fill in the Blanks (completar oraciones) | ✅ hecho (elegir la palabra) | Agregar variante de escribir o decir la palabra faltante. | 0 |
| 2 | Sentence Transformation (transformar oraciones) | 🔜 nuevo | Pasar una oración de afirmativa a negativa o pregunta, o cambiar el tiempo. Se arma desde `tiempos.json` con pares de oraciones y respuesta esperada. | 0 |
| 3 | Sentence Matching (relacionar oraciones y conectores) | 🔜 nuevo | Unir dos mitades o elegir el conector correcto, con los datos de la categoría *Conectores*. | 0 |
| 4 | Error Detection and Correction | ✅ parcial (elegir la correcta) | Agregar "encontrá y corregí el error" (escribir o decir la versión correcta). | 0 |
| 5 | Role Play (juego de roles) | ✅ hecho (con IA) | Una escena por nivel, con la categoría como tema. | Sí, con tope |
| 6 | Word Scramble (ordenar palabras) | ✅ hecho | — | 0 |
| 7 | Dialogue Completion (completar diálogos) | 🔜 nuevo | Diálogos cortos precargados con un turno faltante para elegir o decir. | 0 |
| 8 | Choose Your Own Story (historias con opciones) | 🔜 nuevo | Historias ramificadas precargadas: cada elección lleva a otra escena. Motor simple de nodos. | 0 |
| 9 | Guided Writing (redacción guiada) | 🔜 nuevo | Consigna guiada con requisitos (estructura y palabras a usar). Como el objetivo es hablar, se podrá **decir o escribir**. La corrección de requisitos es en código; la devolución con IA es opcional y con tope. | 0 (IA opcional) |

Además, por el enfoque en hablar, se mantienen tres ejercicios propios: **escuchar y elegir**, **repetir en voz alta (shadowing)** y **decir la frase de memoria**. En total, 12 tipos.

De los 9 del documento, solo el role-play y la devolución opcional del punto 9 usan la IA. El resto se corrige en código.

## Propuesta para armar los niveles (borrador para validar)

Mantener el orden de los tiempos del documento (simple → continuo → pasado → futuro) y asignar a cada categoría el tiempo que más naturalmente se usa en ella:

| Unidad | Categoría | Tiempo en foco |
|---|---|---|
| 1 | Información personal | Presente Simple (con *to be*) |
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
| 12 | Expresiones y cortesía | *Will* (ofertas y promesas) |

Cada unidad se divide en niveles chicos (por grupo de la categoría) para que el mapa sea largo y cada paso corto.

## Pendientes conocidos

- El documento trae **una traducción por palabra**, pero no de las oraciones de ejemplo. Para los ejercicios de escuchar y elegir significado hay que agregarlas (las redacta Claude y las revisa el alumno).
- Los **errores típicos** para "detectar el error" tampoco están en el documento; hay que agregarlos por oración (a mano, o por reglas del tiempo verbal cuando se pueda).
- Las unidades 5, 6, 10 y 11 combinan tiempos: hay que validar esa asignación con el alumno.
