import yts from "yt-search"
import ytdl from "@distube/ytdl-core"

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

  const match =
    input.match(ytRegex)

  const videoId =
    match ? match[1] : null

  /* LINK DIRECTO */

  if (videoId) {

    try {

      const info =
        await yts({
          videoId
        })

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

  /* BUSCAR POR TEXTO */

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

/* =========================================
   DESCARGAR AUDIO DIRECTAMENTE
========================================= */

async function getAudioBuffer(url) {

  console.log("")
  console.log("========== PLAY YTDL ==========")
  console.log("URL:", url)

  /*
   * Solo audio.
   * highestaudio selecciona el mejor formato
   * de audio disponible.
   */

  const stream =
    ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio"
    })

  const chunks = []

  return new Promise(
    (resolve, reject) => {

      stream.on(
        "data",
        chunk => {
          chunks.push(chunk)
        }
      )

      stream.on(
        "end",
        () => {

          const buffer =
            Buffer.concat(chunks)

          console.log(
            "AUDIO:",
            buffer.length,
            "bytes"
          )

          console.log(
            "=============================="
          )

          if (!buffer.length) {
            return reject(
              new Error(
                "EL AUDIO LLEGÓ VACÍO."
              )
            )
          }

          resolve(buffer)
        }
      )

      stream.on(
        "error",
        error => {

          console.error(
            "YTDL ERROR:",
            error
          )

          reject(error)
        }
      )
    }
  )
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

        vcard
      }
    }
  }
}

/* =========================================
   PLAY
========================================= */

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

    /* SIN TEXTO */

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

    /* =====================================
       BUSCAR
    ===================================== */

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

    console.log(
      "PLAY:",
      result.title
    )

    await m.react(
      "⏳"
    )

    /* =====================================
       CONTACTO
    ===================================== */

    const fcontacto =
      crearContacto(
        conn
      )

    /* =====================================
       ENCABEZADO
    ===================================== */

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

    /* =====================================
       OBTENER AUDIO
    ===================================== */

    const audioBuffer =
      await getAudioBuffer(
        result.url
      )

    /* =====================================
       NOMBRE
    ===================================== */

    const title =
      cleanFileName(
        result.title
      )

    /* =====================================
       ENVIAR AUDIO
    ===================================== */

    await conn.sendMessage(
      m.chat,

      {
        audio:
          audioBuffer,

        fileName:
          `${title}.webm`,

        mimetype:
          "audio/webm",

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
      "✅ PLAY ENVIADO:",
      title
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