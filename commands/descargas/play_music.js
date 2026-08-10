import fetch from "node-fetch"
import yts from "yt-search"

/* =========================================
   LIMPIAR NOMBRE
========================================= */

function cleanFileName(name) {
  return (name || "YouTube")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 80)
}

/* =========================================
   BUSCAR YOUTUBE
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
        title: info.title || "Video de YouTube",
        url: info.url || `https://youtu.be/${videoId}`,
        videoId,
        thumbnail:
          info.thumbnail ||
          info.image ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: info.timestamp || "Desconocida",
        author: info.author?.name || info.author || "Desconocido"
      }
    } catch {
      return {
        title: "Video de YouTube",
        url: `https://youtu.be/${videoId}`,
        videoId,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
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
    duration: result.timestamp || "Desconocida",
    author: result.author?.name || result.author || "Desconocido"
  }
}

/* =========================================
   API DE DESCARGA (COBALT / RYZENDESU)
========================================= */

async function downloadYoutube(url) {
  // Intentar con API 1 (Ryzendesu)
  try {
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`)
    if (res.ok) {
      const json = await res.json()
      const downloadUrl = json.url || json.dl || json.result?.downloadUrl
      if (downloadUrl) return { dl: downloadUrl, title: json.title || json.result?.title }
    }
  } catch (e) {
    console.error("Falló servidor 1, intentando servidor secundario...")
  }

  // Intentar con API 2 (Fallback: Delirius)
  const fallbackRes = await fetch(`https://deliriussapi-official.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`)
  if (!fallbackRes.ok) throw new Error("NINGÚN SERVIDOR DE DESCARGA RESPONDIÓ.")

  const fallbackJson = await fallbackRes.json()
  const fallbackUrl = fallbackJson.data?.download?.url || fallbackJson.data?.dl || fallbackJson.result?.download

  if (!fallbackUrl) throw new Error("NO SE PUDO OBTENER EL ENLACE DE DESCARGA.")

  return {
    dl: fallbackUrl,
    title: fallbackJson.data?.title || "audio"
  }
}

/* =========================================
   CONTACTO ALAN STORE MX (VERIFICADO)
========================================= */

function crearContacto(conn) {
  const botNumber = conn.user.jid.split("@")[0]

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
   PLAY AUTOMÁTICO (SOLO CANCIÓN)
========================================= */

const handler = async (m, { conn, text }) => {
  try {
    const input = (text || "").trim()

    if (!input) {
      return conn.reply(
        m.chat,
        `> ✦ INGRESA EL NOMBRE O LINK DE *YOUTUBE* ✦\n\nEjemplo:\n.play pollito pío`,
        m
      )
    }

    await m.react("🔎")

    const result = await searchYoutube(input)

    if (!result) {
      await m.react("✖️")
      return conn.reply(
        m.chat,
        `> ✖ NO SE ENCONTRARON RESULTADOS.`,
        m
      )
    }

    await m.react("⏳")

    const fcontacto = crearContacto(conn)
    const json = await downloadYoutube(result.url)
    const title = cleanFileName(json.title || result.title)

    /* ENVIAR ÚNICAMENTE LA CANCIÓN */

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: json.dl },
        fileName: `${title}.mp3`,
        mimetype: "audio/mpeg",
        ptt: false
      },
      {
        quoted: fcontacto
      }
    )

    await m.react("✔️")
    console.log(`✅ PLAY ENVIADO: ${title}`)

  } catch (e) {
    console.error("========== ERROR PLAY ==========")
    console.error(e)
    console.error("================================")

    await m.react("✖️")
    return conn.reply(
      m.chat,
      `> ⚠️ *ERROR AL DESCARGAR LA CANCIÓN*\n\n${e.message || e}`,
      m
    )
  }
}

/* =========================================
   CONFIGURACIÓN
========================================= */

handler.command = ["play"]
handler.help = ["play <canción o link>"]
handler.tags = ["media"]

export default handler
