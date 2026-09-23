# Web: Colly, inglés para hablar

Interfaz de juego del agente: un mapa de unidades y lecciones, los 12 tipos de ejercicio, práctica con voz y un role-play con IA. La mascota es **Colly**, un border collie animado dibujado en SVG (personaje original).

## Diseño visual

- Estilo de juego: botones gruesos con relieve, colores intensos y planos, esquinas redondeadas, barra de progreso animada, mascota que reacciona (contenta, festejando, triste, pensando).
- Paleta en **gama del azul** (cobalto, celeste, azul marino, índigo). Solo aparecen un coral suave para marcar errores y un dorado para XP y coronas.
- Modo claro y oscuro automáticos, adaptado a celular y a escritorio, y con animaciones reducidas si el sistema lo pide.

## Cómo funciona

| Pieza | Dónde | Qué hace |
|---|---|---|
| Motor | `src/` | El mismo código que usa la consola: ejercicios, corrección, repaso espaciado, XP, coronas. Corre en el navegador (0 tokens). |
| Pantallas | `web/screens/` | Mapa, introducción de lección, práctica, resumen, role-play y perfil. |
| Ejercicios | `web/exercises.js` | Cómo se ve y se contesta cada tipo. |
| Sesión | `web/session.js` | Cola de ejercicios, corrección y progreso (sin DOM, probada en Node). |
| Guardado | `web/storage.js` | Progreso, perfil y ajustes en el navegador (`localStorage`). |
| Voz | `web/speech.js` | Escuchar y hablar con la voz del propio navegador. |
| Role-play | `api/roleplay.js` + `src/roleplay-api.js` | Único punto que usa IA. La API key vive solo en el servidor. |

Los ejercicios y la corrección no consumen tokens. El progreso y los datos personales **no salen del navegador**.

## Cómo probarla en tu PC

```bash
npm.cmd run web
```

Abrí http://localhost:5173. Sin configurar nada, todo funciona salvo el role-play, que muestra un aviso explicando qué falta.

Para probar también el role-play en local, definí estas variables en la terminal antes de correr el servidor:

```powershell
$env:ANTHROPIC_API_KEY = "tu-key"
$env:ROLEPLAY_ACCESS_CODE = "un-codigo-que-elijas"
npm.cmd run web
```

Después escribí ese mismo código en **Perfil → Role-play con IA**.

## Cómo publicarla en Vercel

1. Crear un proyecto en Vercel importando el repositorio de GitHub (la cuenta de Vercel la creás y autorizás vos).
2. En *Settings → Environment Variables* cargar:
   - `ANTHROPIC_API_KEY`: tu key de Anthropic.
   - `ROLEPLAY_ACCESS_CODE`: un código que elijas y compartas solo con quien deba usar el role-play.
   - Opcional: `TUTOR_MODEL` (por defecto `claude-haiku-4-5`).
3. En la consola de Anthropic, **poné un límite de gasto mensual**.
4. Deploy. Con cada push a `main`, Vercel publica de nuevo.

Sin la key o sin el código, el role-play queda apagado (seguro por defecto). El resto de la app funciona igual.

## Protecciones del endpoint del role-play

Una URL pública podría gastar créditos ajenos, así que el endpoint:

- exige un **código de acceso** (comparación de tiempo constante) y queda apagado si no está configurado;
- **limita** a 40 pedidos por IP cada 10 minutos, contando también los intentos con código incorrecto;
- valida el formato: hasta 12 mensajes de 400 caracteres, solo roles `user` y `assistant`, y una unidad que exista;
- arma el contexto de la escena **en el servidor** (el navegador no puede inyectar instrucciones);
- responde errores genéricos, sin detalles internos.

Límite conocido: el contador por IP vive en la memoria de cada instancia y se reinicia cuando Vercel la recicla, así que frena abusos simples pero no reemplaza el límite de gasto de Anthropic.

## Voz y privacidad

- El reconocimiento de voz lo hace el navegador. Por defecto envía el audio a su proveedor (Google en Chrome, Apple en Safari). Esta app nunca recibe el audio.
- Funciona en Chrome, Edge y Safari; en Firefox suele estar desactivado y se contesta escribiendo.
- El micrófono solo funciona en `https://` o `localhost`.
- El perfil del alumno (nombre, familia, etc.) se guarda solo en su navegador y personaliza las frases; no se envía al servidor.

## Sin verificar todavía

- **La publicación en Vercel:** `vercel.json` y `.vercelignore` están armados, pero no se probó un deploy real. En particular, la opción `includeFiles` de la función debe confirmarse al desplegar.
- **La instalación como app (PWA):** existen el manifiesto y el service worker, pero no se comprobó la instalación en un dispositivo. El service worker solo se registra en `https`.
- **Voz en dispositivos reales:** se probó la interfaz en el navegador de escritorio; el reconocimiento y la síntesis de voz dependen de cada navegador y sistema.
- **El role-play con la API real desde la web** (se probó con un servidor simulado y con pruebas automáticas del endpoint).
