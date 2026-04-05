# Audiolibro — PDF a Audiolibro

Convierte cualquier PDF en audio MP3 con voces en español de España, México, Argentina y Colombia.

## Proveedor TTS: Google Cloud Text-to-Speech

**¿Por qué Google Cloud TTS?**
- Soporte nativo de locales en español: `es-ES`, `es-MX`, `es-US`
- Voces Neural2 y WaveNet de alta fidelidad
- Free tier generoso: **1 millón de caracteres/mes** con Neural2
- Autenticación simple con API key (sin service account)
- Latencia baja, fiable para producción

**Limitación de Argentina/Colombia:** Google no tiene locales `es-AR` ni `es-CO`.
Argentina usa voces `es-ES` (más cercanas fonéticamente al español rioplatense).
Colombia usa voces `es-US` (el español neutro más cercano a LATAM).
Para acentos más específicos en una v2, se puede integrar ElevenLabs o Azure Cognitive Services.

---

## Instalación

### 1. Instalar dependencias

```bash
cd /ruta/al/proyecto
npm install
```

### 2. Configurar la API key de Google

```bash
cp .env.local.example .env.local
```

Luego edita `.env.local` y reemplaza `tu_api_key_aqui`:

```
GOOGLE_TTS_API_KEY=AIzaSy...tu_clave_aqui
```

#### Obtener la API key (5 min):
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo o usa uno existente
3. En el menú lateral: **APIs y servicios → Biblioteca**
4. Busca **"Cloud Text-to-Speech API"** y habilítala
5. Ve a **APIs y servicios → Credenciales → Crear credencial → Clave de API**
6. (Recomendado) Restringe la clave a Cloud Text-to-Speech API
7. Copia la clave en `.env.local`

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Uso

1. **Sube un PDF** — arrastra o haz clic para seleccionar (máx. 50 MB)
2. **Revisa el texto** — verifica que el texto se extrajo correctamente
3. **Configura la voz** — elige país/acento, voz, velocidad y tono
4. **Convierte** — el progreso se muestra en tiempo real (SSE streaming)
5. **Escucha y descarga** — reproductor integrado + botón de descarga MP3

---

## Estructura del proyecto

```
audiolibro/
├── app/
│   ├── page.tsx                  Página principal (máquina de estados)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── extract-text/         POST: parseo de PDF → texto
│       │   └── route.ts
│       ├── convert-audio/        POST: texto → MP3 (SSE streaming)
│       │   └── route.ts
│       ├── audio/[jobId]/        GET: sirve el MP3 generado
│       │   └── route.ts
│       └── voices/               GET: lista de voces disponibles
│           └── route.ts
├── components/
│   ├── FileUpload.tsx            Drag & drop para PDF
│   ├── TextPreview.tsx           Vista previa del texto extraído
│   ├── VoiceConfig.tsx           Selector de voz, velocidad y tono
│   └── AudioPlayer.tsx           Reproductor HTML5 + descarga
├── lib/
│   ├── voices.ts                 Catálogo de voces en español
│   ├── text-chunker.ts           Fragmentación inteligente de texto
│   ├── tts.ts                    Wrapper de la REST API de Google TTS
│   └── audio-store.ts            Almacén en memoria (TTL 30 min)
├── types/
│   └── index.ts                  Tipos TypeScript compartidos
├── .env.local.example
└── INSTRUCCIONES.md
```

---

## PDFs largos

El texto se fragmenta automáticamente en chunks de ~4 500 caracteres.
Cada chunk se convierte a MP3 y se concatenan al final.
El progreso se muestra en tiempo real gracias a SSE (Server-Sent Events).

**Límite por defecto:** 200 000 caracteres (~100 páginas).
Puedes aumentarlo en `.env.local`:
```
NEXT_PUBLIC_MAX_CHARS=500000
```

> **Nota:** Google TTS cobra por caracteres procesados. Revisa el free tier antes de procesar libros enteros.

---

## Escalar a producción

| Área                | Mejora recomendada |
|---------------------|--------------------|
| Almacenamiento audio | Reemplazar `lib/audio-store.ts` con AWS S3 / GCS |
| Colas de trabajo    | Bull/BullMQ + Redis para jobs asíncronos |
| Autenticación       | NextAuth.js |
| Base de datos       | PostgreSQL (guardar historial de conversiones) |
| Deploy              | Vercel (aumentar `maxDuration`) o Railway/Fly.io |
| PDFs escaneados     | Integrar OCR: Tesseract.js o Google Vision API |
| Más acentos         | ElevenLabs API o Azure Cognitive Services |

---

## Comandos útiles

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build de producción
npm run start    # Servidor de producción (requiere npm run build)
npm run lint     # ESLint
```

---

## Notas técnicas

- **pdf-parse** se importa dinámicamente para evitar el side-effect de lectura de archivos de test que ocurre cuando webpack lo bundlea estáticamente.
- Los MP3 generados se concatenan binariamente. El formato MP3 es frame-based, por lo que la concatenación produce audio válido sin glitches perceptibles.
- El audio se almacena en memoria con TTL de 30 minutos. Para múltiples usuarios simultáneos en producción, migrar a almacenamiento externo.
