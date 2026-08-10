import fetch from "node-fetch"
import yts from "yt-search"

const apiKey = "barboza"

function cleanFileName(name) {
  return (name || "YouTube")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 80)
}

async function searchYoutube(input) {
  const ytRegex =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/

  const videoMatch = input.match(ytRegex)
  const videoId = videoMatch ? videoMatch[1] : null

  if (videoId) {
    try {
      const info = await yts({ videoId })

      return {
        title: info.title || "Video de YouTube",
        url: info.url || `https://youtu.be/${videoId}`,
        videoId,
        thumbnail:
          info.thumbnail ||
          info.image ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: info.timestamp || "Desconocida",
        author:
          info.author?.name ||
          info.author ||
          "Desconocido"
      }
    } catch {
      return {
        title: "Video de YouTube",
        url: `https://youtu.be/${videoId}`,
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
      result.timestamp ||
      "Desconocida",
    author:
      result.author?.name ||
      result.author ||
      "Desconocido"
  }
}

async function downloadYoutube(url) {
  const apiUrl =
    `https://getmod-mediahub.vercel.app/api/ytdl?url=${encodeURIComponent(url)}&format=mp3&apikey=${apiKey}`

  const res = await fetch(apiUrl)

  if (!res.ok) {
    throw new Error(
      `LA API NO RESPONDIÓ. HTTP ${res.status}`
    )
  }

  const json = await res.json()

  if (!json.status || !json.dl) {
    throw new Error(
      "LA API NO DEVOLVIÓ EL AUDIO."
    )
  }

  return json
}

/*
 * CONTACTO FAKE DE ALAN STORE MX
 */
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
        vcard
      }
    }
  }
}

/*
 * DESCARGAR EL MP3 COMO BUFFER
 */
async function getAudioBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0"
    }
  })

  if (!response.ok) {
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

  return buffer
}

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
.play tuma bellakath`,
        m
      )
    }

    await m.react("🔎")

    /*
     * BUSCAR EN YOUTUBE
     */
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
     * OBTENER LINK DEL MP3
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
     * CREAR CONTACTO
     */
    const fcontacto =
      crearContacto(conn)

    /*
     * ENCABEZADO
     */
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
        text: infoText
      },
      {
        quoted: fcontacto
      }
    )

    /*
     * DESCARGAR EL MP3 A BUFFER
     *
     * Esto evita el error:
     * Failed to fetch stream
     */
    const audioBuffer =
      await getAudioBuffer(
        json.dl
      )

    /*
     * ENVIAR AUDIO
     */
    await conn.sendMessage(
      m.chat,
      {
        audio:
          audioBuffer,

        fileName:
          `${title}.mp3`,

        mimetype:
          "audio/mpeg",

        ptt: false
      },
      {
        quoted:
          fcontacto
      }
    )

    await m.react("✔️")

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