import fetch from "node-fetch"
import yts from "yt-search"

const apiKey = "barboza"

/* ================================
   LIMPIAR NOMBRE DEL ARCHIVO
================================ */

function cleanFileName(name) {
  return (name || "YouTube")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 80)
}

/* ================================
   BUSCAR EN YOUTUBE
================================ */

async function searchYoutube(input) {

  const ytRegex =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/

  const videoMatch =
    input.match(ytRegex)

  const videoId =
    videoMatch
      ? videoMatch[1]
      : null

  /* LINK DIRECTO */

  if (videoId) {

    try {

      const info =
        await yts({ videoId })

      return {
        title:
          info.title ||
          "Video de YouTube",

        url:
          info.url ||
          `https://youtu.be/${videoId}`,

        videoId,

        thumbnail:
          info.thumbnail ||
          info.image ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        duration:
          info.timestamp ||
          "Desconocida",

        author:
          info.author?.name ||
          info.author ||
          "Desconocido"
      }

    } catch {

      return {
        title:
          "Video de YouTube",

        url:
          `https://youtu.be/${videoId}`,

        videoId,

        thumbnail:
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        duration:
          "Desconocida",

        author:
          "Desconocido"
      }
    }
  }

  /* BÚSQUEDA */

  const search =
    await yts(input)

  const result =
    search.videos?.[0]

  if (!result)
    return null

  return {
    title:
      result.title,

    url:
      result.url,

    videoId:
      result.videoId,

    thumbnail:
      result.thumbnail ||
      result.image ||
      `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,

    duration:
      result.timestamp ||
      "Desconocida",

    author:
      result.author?.name ||
      result.author ||
      "Desconocido"
  }
}

/* ================================
   API DE DESCARGA
================================ */

async function downloadYoutube(url) {

  const apiUrl =
    `https://getmod-mediahub.vercel.app/api/ytdl?url=${encodeURIComponent(url)}&format=mp3&apikey=${apiKey}`

  console.log("")
  console.log("========== PLAY REQUEST ==========")
  console.log("URL YouTube:", url)
  console.log("API:", apiUrl)
  console.log("==================================")

  const res =
    await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "Accept":
          "application/json,text/plain,*/*"
      }
    })

  const responseText =
    await res.text()

  console.log("")
  console.log("========== PLAY API RESPONSE ==========")
  console.log("HTTP:", res.status)
  console.log("Respuesta:")
  console.log(responseText)
  console.log("========================================")
  console.log("")

  if (!res.ok) {
    throw new Error(
      `LA API RESPONDIÓ CON HTTP ${res.status}`
    )
  }

  let json

  try {

    json =
      JSON.parse(responseText)

  } catch {

    throw new Error(
      "LA API NO DEVOLVIÓ JSON VÁLIDO."
    )
  }

  console.log(
    "========== PLAY JSON =========="
  )

  console.log(
    JSON.stringify(
      json,
      null,
      2
    )
  )

  console.log(
    "==============================="
  )

  if (!json.status) {

    throw new Error(
      json.message ||
      "LA API INDICÓ QUE LA DESCARGA FALLÓ."
    )
  }

  if (!json.dl) {

    throw new Error(
      "LA API NO DEVOLVIÓ EL CAMPO 'dl'."
    )
  }

  return json
}

/* ================================
   DESCARGAR AUDIO
================================ */

async function getAudioBuffer(url) {

  console.log("")
  console.log(
    "========== DESCARGANDO AUDIO =========="
  )

  console.log(
    "URL:",
    url
  )

  const response =
    await fetch(url, {
      redirect: "follow",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

        "Accept":
          "audio/mpeg,audio/*,*/*",

        "Referer":
          "https://www.youtube.com/"
      }
    })

  console.log(
    "HTTP AUDIO:",
    response.status
  )

  console.log(
    "URL FINAL:",
    response.url
  )

  console.log(
    "CONTENT-TYPE:",
    response.headers.get(
      "content-type"
    )
  )

  console.log(
    "========================================"
  )

  if (!response.ok) {

    if (response.status === 403) {

      throw new Error(
        "EL SERVIDOR DEL AUDIO RECHAZÓ LA DESCARGA (HTTP 403). LA URL GENERADA POR LA API NO PERMITE DESCARGA DIRECTA DESDE EL SERVIDOR."
      )
    }

    throw new Error(
      `NO SE PUDO DESCARGAR EL AUDIO. HTTP ${response.status}`
    )
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    )

  if (!buffer.length) {

    throw new Error(
      "EL AUDIO DESCARGADO ESTÁ VACÍO."
    )
  }

  console.log(
    "AUDIO DESCARGADO:",
    buffer.length,
    "bytes"
  )

  return buffer
}

/* ================================
   CONTACTO ALAN STORE
================================ */

function crearContacto(conn) {

  const botNumber =
    conn.user.jid.split("@")[0]

  const vcard =
`BEGIN:VCARD
VERSION:3.0
FN:𝐀𝐋𝐀𝐍 𝐒𝐓𝐎𝐑𝐄 𝐌𝐗
ORG:Streaming Digital;
TEL;type=CELL;type=VOICE;waid=${botNumber}:+${botNumber}
END:VCARD`

  return {

    key: {

      fromMe:
        false,

      participant:
        "0@s.whatsapp.net",

      remoteJid:
        "status@broadcast",

      id:
        "AlanStoreFake"
    },

    message: {

      contactMessage: {

        displayName:
          "𝐀𝐋𝐀𝐍 𝐒𝐓𝐎𝐑𝐄",

        vcard:
          vcard
      }
    }
  }
}

/* ================================
   PLAY
================================ */

const handler =
async (
  m,
  {
    conn,
    text
  }
) => {

  try {

    const input =
      (text || "").trim()

    if (!input) {

      return conn.reply(
        m.chat,

        `> ✦ INGRESA EL NOMBRE O LINK DE *YOUTUBE* ✦

Ejemplo:

.play así como lo pedí`,

        m
      )
    }

    await m.react(
      "🔎"
    )

    /* BUSCAR */

    const result =
      await searchYoutube(
        input
      )

    if (!result) {

      await m.react(
        "✖️"
      )

      return conn.reply(
        m.chat,

        `> ✖ NO SE ENCONTRARON RESULTADOS.`,

        m
      )
    }

    await m.react(
      "⏳"
    )

    /* OBTENER INFORMACIÓN DE LA API */

    const json =
      await downloadYoutube(
        result.url
      )

    const title =
      cleanFileName(
        json.title ||
        result.title
      )

    /* CONTACTO */

    const fcontacto =
      crearContacto(
        conn
      )

    /* ENCABEZADO */

    const infoText =
`╭─「 🎵 𝐀𝐋𝐀𝐍 𝐒𝐓𝐎𝐑𝐄 𝐏𝐋𝐀𝐘 」
│
│ 🎶 *${result.title}*
│ 👤 *${result.author}*
│ ⏱️ *${result.duration}*
│
╰───────────────

🎧 *Descargando canción...*`

    await conn.sendMessage(
      m.chat,

      {
        text:
          infoText
      },

      {
        quoted:
          fcontacto
      }
    )

    /* ================================
       DESCARGAR MP3
    ================================= */

    const audioBuffer =
      await getAudioBuffer(
        json.dl
      )

    /* ================================
       ENVIAR MP3
    ================================= */

    await conn.sendMessage(
      m.chat,

      {
        audio:
          audioBuffer,

        fileName:
          `${title}.mp3`,

        mimetype:
          "audio/mpeg",

        ptt:
          false
      },

      {
        quoted:
          fcontacto
      }
    )

    await m.react(
      "✔️"
    )

    console.log(
      `✅ PLAY ENVIADO: ${title}`
    )

  } catch (e) {

    console.error(
      ""
    )

    console.error(
      "========== ERROR PLAY =========="
    )

    console.error(
      e
    )

    console.error(
      "================================"
    )

    await m.react(
      "✖️"
    )

    return conn.reply(
      m.chat,

      `> ⚠️ *ERROR AL DESCARGAR LA CANCIÓN*

${e.message || e}`,

      m
    )
  }
}

/* ================================
   CONFIGURACIÓN DEL COMANDO
================================ */

handler.command = [
  "play"
]

handler.help = [
  "play <texto/link>"
]

handler.tags = [
  "media"
]

export default handler