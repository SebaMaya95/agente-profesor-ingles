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

### Parte 1: Anthropic (workspace con límite de gasto y API key)

1. Entrar a la consola de Anthropic (platform.claude.com) con tu cuenta.
2. **Settings → Workspaces → Create workspace**. Nombre `Colly`. (No se puede fijar límite en el workspace "Default", por eso se crea uno propio.)
3. Cambiar al workspace `Colly` con el selector de arriba a la izquierda.
4. En los ajustes del workspace, pestaña **Spend limits**: fijar el límite mensual (por ejemplo, US$ 5) y activar las alertas de aviso.
5. Crear la API key **dentro de ese workspace** (sección *API keys*, elegir el workspace `Colly`). Se muestra una sola vez: copiarla a un gestor de contraseñas. Nunca al chat ni al repo.

### Parte 2: Vercel

1. Crear la cuenta en vercel.com con el botón de GitHub (plan Hobby, gratis, para uso no comercial).
2. **Add New… → Project → Import Git Repository**, elegir `agente-profesor-ingles`. Conviene darle a Vercel acceso solo a ese repositorio.
3. En *Configure Project*: Framework Preset **Other**; el resto se deja como está (lo define `vercel.json`).
4. Antes de desplegar, abrir *Environment Variables* y cargar (solo en **Production**):
   - `ANTHROPIC_API_KEY`: la key del paso anterior.
   - `ROLEPLAY_ACCESS_CODE`: un código que generes vos (por ejemplo, con `[guid]::NewGuid().ToString("N").Substring(0,16)` en PowerShell) y compartas solo con quien deba usar el role-play.
   - Opcional: `TUTOR_MODEL` (por defecto `claude-haiku-4-5`).
5. **Deploy**. Con cada push a `main`, Vercel publica de nuevo. Si cambiás una variable después, hay que hacer *Redeploy*: solo aplica a los despliegues nuevos.

Sin la key o sin el código, el role-play queda apagado (seguro por defecto). El resto de la app funciona igual.

### Parte 3: Verificar el despliegue

- La URL carga el mapa y se puede jugar una lección.
- `https://TU-URL/data/perfil.json` y `https://TU-URL/Vocabulario.docx` devuelven 404.
- En **Perfil → Role-play con IA**, pegar el código y guardar. Para probar sin superar la unidad, abrir la consola del navegador y ejecutar `__app.go("roleplay", { unitId: "informacion-personal" })`.
- Si el role-play dice "no está configurado": faltan las variables o falta el *Redeploy*. Si dice "código incorrecto": revisar el código en Perfil. Si falla con otro error: mirar *Logs* del proyecto en Vercel (la función `/api/roleplay`).
- En la consola de Anthropic, el consumo debe aparecer en el workspace `Colly`.

### Si la key se filtra

Revocarla en la consola de Anthropic (sección *API keys*), crear otra en el mismo workspace, cambiarla en Vercel y hacer *Redeploy*.

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

- **La publicación en Vercel:** `vercel.json` y `.vercelignore` están armados y la propiedad `includeFiles` existe en la documentación de Vercel (acepta un patrón glob), pero no se probó un deploy real. Si el role-play falla con error de archivos no encontrados, hay que revisar ese patrón.
- **La instalación como app (PWA):** existen el manifiesto y el service worker, pero no se comprobó la instalación en un dispositivo. El service worker solo se registra en `https`.
- **Voz en dispositivos reales:** se probó la interfaz en el navegador de escritorio; el reconocimiento y la síntesis de voz dependen de cada navegador y sistema.
- **El role-play con la API real desde la web** (se probó con un servidor simulado y con pruebas automáticas del endpoint).
