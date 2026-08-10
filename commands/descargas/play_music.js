import yts from 'yt-search'
import ytdl from '@distube/ytdl-core'

/*
 * PLAY - ALAN STORE MX
 * Comando: .play <canción o link>
 */

function cleanFileName(name = "YouTube") {
  return String(name)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "YouTube"
}

function getYoutubeId(text = "") {
  const match = text.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
  )
  return match?.[1] || null
}

async function searchYoutube(input) {
  const videoId = getYoutubeId(input)

  // Enlace directo
  if (videoId) {
    try {
      const info = await yts({ videoId })
      return {
        title: info.title || "Video de YouTube",
        url: info.url || `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: info.timestamp || "Desconocida",
        author: info.author?.name || "Desconocido"
      }
    } catch {
      return {
        title: "Video de YouTube",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: "Desconocida",
        author: "Desconocido"
      }
    }
  }

  // Búsqueda por texto
  const search = await yts(input)
  const result = search.videos?.[0]

  if (!result) return null

  return {
    title: result.title,
    url: result.url,
    videoId: result.videoId,
    thumbnail: result.thumbnail || `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,
    duration: result.timestamp || "Desconocida",
    author: result.author?.name || "Desconocido"
  }
}

async function downloadAudioBuffer(url) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25 // Buffer optimizado para evitar descargas cortadas
    })

    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', (err) => reject(err))
  })
}

const handler = async (m, { conn, text }) => {
  const input = String(text || "").trim()

  if (!input) {
    return conn.reply(
      m.chat,
      `🎵 *PLAY - ALAN STORE MX*\n\nEscribe el nombre de una canción o pega un enlace de YouTube.\n\n*Ejemplo:*\n.play despacito\n\n*O:*\n.play https://youtu.be/XXXXXXXXXXX`,
      m
    )
  }

  try {
    if (typeof m.react === "function") {
      await m.react("🔍")
    }

    await conn.reply(m.chat, `🔍 Buscando en YouTube...`, m)

    const result = await searchYoutube(input)

    if (!result) {
      if (typeof m.react === "function") {
        await m.react("❌")
      }
      return conn.reply(m.chat, "❌ No encontré ningún video con esa búsqueda.", m)
    }

    await conn.reply(
      m.chat,
      `🎵 *${result.title}*\n\n👤 *Autor:* ${result.author}\n⏱️ *Duración:* ${result.duration}\n\n⏳ Procesando audio con YTDL...`,
      m
    )

    if (typeof m.react === "function") {
      await m.react("⏳")
    }

    // Descarga directa del audio usando YTDL
    const audioBuffer = await downloadAudioBuffer(result.url)
    const title = cleanFileName(result.title)

    await conn.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        fileName: `${title}.mp3`,
        mimetype: "audio/mpeg",
        ptt: false
      },
      { quoted: m }
    )

    if (typeof m.react === "function") {
      await m.react("✅")
    }

    console.log(`[PLAY] ENVIADO: ${title}`)
  } catch (error) {
    console.error("========== ERROR DE REPRODUCCIÓN ==========")
    console.error(error)
    console.error("==========================================")

    if (typeof m.react === "function") {
      await m.react("❌")
    }

    return conn.reply(
      m.chat,
      `❌ *No pude descargar el audio.*\n\n${error?.message || String(error)}`,
      m
    )
  }
}

handler.command = /^(play|song|musica|música)$/i
handler.help = ["play <canción o enlace>"]
handler.tags = ["media"]
handler.limit = false

export default handler
