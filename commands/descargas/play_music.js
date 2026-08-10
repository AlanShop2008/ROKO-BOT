import fetch from "node-fetch"
import yts from "yt-search"

const apiKey = "barboza"

/* =========================================
   LIMPIAR NOMBRE
========================================= */

function cleanFileName(name) {
  return (name || "YouTube")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 80)
}

/* =========================================
   BUSCAR EN YOUTUBE
========================================= */

async function searchYoutube(input) {

  const ytRegex =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/

  const videoMatch = input.match(ytRegex)
  const videoId = videoMatch ? videoMatch[1] : null

  if (videoId) {
    try {

      const info = await yts({ videoId })

      return {
        title:
          info.title || "Video de YouTube",

        url:
          info.url ||
          `https://youtu.be/${videoId}`,

        videoId,

        thumbnail:
          info.thumbnail ||
          info.image ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        duration:
          info.timestamp || "Desconocida",

        author:
          info.author?.name ||
          info.author ||
          "Desconocido"
      }

    } catch {

      return {
        title: "Video de YouTube",

        url:
          `https://youtu.be/${videoId}`,

        videoId,

        thumbnail:
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        duration: "Desconocida",

        author: "Desconocido"
      }
    }
  }

  const search = await yts(input)
  const result = search.videos?.[0]

  if (!result) return null

  return {
    title: result.title,
    url: result.url,
    videoId: result.videoId,

    thumbnail:
      result.thumbnail ||
      result.image ||
      `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,

    duration:
      result.timestamp || "Desconocida",

    author:
      result.author?.name ||
      result.author ||
      "Desconocido"
  }
}

/* =========================================
   API DE DESCARGA
========================================= */

async function downloadYoutube(url) {

  const apiUrl =
    `https://getmod-mediahub.vercel.app/api/ytdl?url=${encodeURIComponent(url)}&format=mp3&apikey=${apiKey}`

  const res = await fetch(apiUrl)

  if (!res.ok) {
    throw new Error(
      "LA API NO RESPONDIÓ CORRECTAMENTE."
    )
  }

  const json = await res.json()

  if (!json.status || !json.dl) {
    throw new Error(
      "NO SE PUDO OBTENER EL ARCHIVO."
    )
  }

  return json
}

/* =========================================
   CONTACTO ALAN STORE MX
========================================= */

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
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      id: "AlanStoreFake"
    },

    message: {
      contactMessage: {
        displayName: "𝐀𝐋𝐀𝐍 𝐒𝐓𝐎𝐑𝐄",
        vcard
      }
    }
  }
}

/* =========================================
   PLAY
========================================= */

const handler = async (
  m,
  { conn, text }
) => {

  try {

    const input =
      (text || "").trim()

    if (!input) {

      return conn.reply(
        m.chat,

        `> ✦ INGRESA EL NOMBRE O LINK DE *YOUTUBE* ✦

Ejemplo:
.play pollito pío`,

        m
      )
    }

    await m.react("🔎")

    const result =
      await searchYoutube(input)

    if (!result) {

      await m.react("✖️")

      return conn.reply(
        m.chat,
        `> ✖ NO SE ENCONTRARON RESULTADOS.`,
        m
      )
    }

    await m.react("⏳")

    /*
     * CREAR CONTACTO
     * Este será el encabezado del audio
     */

    const fcontacto =
      crearContacto(conn)

    /*
     * OBTENER AUDIO
     */

    const json =
      await downloadYoutube(
        result.url
      )

    const title =
      cleanFileName(
        json.title ||
        result.title
      )

    /*
     * ENVIAR SOLAMENTE LA CANCIÓN
     *
     * Pero citando el contacto de
     * ALAN STORE MX como encabezado.
     */

    await conn.sendMessage(
      m.chat,
      {
        audio: {
          url: json.dl
        },

        fileName:
          `${title}.mp3`,

        mimetype:
          "audio/mpeg",

        ptt: false
      },
      {
        quoted: fcontacto
      }
    )

    await m.react("✔️")

    console.log(
      `✅ PLAY ENVIADO: ${title}`
    )

  } catch (e) {

    console.error(
      "ERROR PLAY:",
      e
    )

    await m.react("✖️")

    return conn.reply(
      m.chat,

      `> ⚠️ *ERROR AL DESCARGAR LA CANCIÓN*

${e.message || e}`,

      m
    )
  }
}

/* =========================================
   CONFIGURACIÓN
========================================= */

handler.command = [
  "play"
]

handler.help = [
  "play <canción o link>"
]

handler.tags = [
  "media"
]

export default handler