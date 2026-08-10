import fetch from "node-fetch"
importar yts desde "yt-search"

/*
 * JUGAR - TIENDA ALAN MX
 * Comando: .play <canción o link>
 *
 * Requisitos:
 * npm i node-fetch yt-search
 */

const apiKey = "barboza"
const API_BASE = "https://getmod-mediahub.vercel.app/api/ytdl"

función cleanFileName(name = "YouTube") {
  devolver String(nombre)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .recortar()
    .slice(0, 80) || "YouTube"
}

función isYoutubeUrl(texto = "") {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(text.trim())
}

función obtenerYoutubeId(texto = "") {
  const coincidencia = texto.coincidencia(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
  )
  ¿Coincidencia de retorno?.[1] || nulo
}

función asíncrona searchYoutube(input) {
  const videoId = getYoutubeId(entrada)

  // Enlace directo
  si (videoId) {
    intentar {
      información constante = esperar yts({ videoId })

      devolver {
        título: info.title || "Video de YouTube",
        URL: info.url || `https://youtu.be/${videoId}`,
        ID de vídeo,
        uña del pulgar:
          Miniatura informativa ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duración: info.timestamp || "Desconocida",
        autor: info.autor?.nombre || "Desconocido"
      }
    } atrapar {
      devolver {
        título: "Video de YouTube",
        URL: `https://youtu.be/${videoId}`,
        ID de vídeo,
        miniatura: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duración: "Desconocida",
        autor: "Desconocido"
      }
    }
  }

  // Búsqueda por texto
  const search = await yts(input)
  const resultado = búsqueda.videos?.[0]

  Si (!resultado) devuelve null

  devolver {
    título: resultado.título,
    URL: resultado.url,
    videoId: resultado.videoId,
    uña del pulgar:
      resultado.miniatura ||
      `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,
    duración: result.timestamp || "Desconocida",
    autor: resultado.autor?.nombre || "Desconocido"
  }
}

función asíncrona downloadYoutube(url) {
  const apiUrl =
    `${API_BASE}?url=${encodeURIComponent(url)}&format=mp3&apikey=${encodeURIComponent(apiKey)}`

  console.log("[PLAY] API:", apiUrl)

  const respuesta = esperar a obtener (apiUrl, {
    método: "GET",
    encabezados: {
      Aceptar: "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  })

  const raw = await response.text()

  si (!respuesta.ok) {
    throw new Error(`API HTTP ${response.status}: ${raw.slice(0, 300)}`)
  }

  dejar json
  intentar {
    json = JSON.parse(raw)
  } atrapar {
    lanzar nuevo Error(
      `La API no desarrolló JSON válido: ${raw.slice(0, 300)}`
    )
  }

  console.log("[PLAY] RESPUESTA API:", json)

  const audioUrl =
    json.dl ||
    json.download ||
    json.url ||
    json.result?.dl ||
    json.result?.url

  si (!audioUrl) {
    lanzar nuevo Error(
      json.message ||
      json.msg ||
      "La API no devolvió un enlace de audio."
    )
  }

  devolver {
    ...json,
    descarga: audioUrl
  }
}

const handler = async (m, { conn, text }) => {
  const input = String(text || "").trim()

  si (!entrada) {
    devolver conn.reply(
      m.chat,
      `ðŸŽµ *PLAY - ALAN STORE MX*

Escribe el nombre de una canción o pega un enlace de YouTube.

Ejemplo:
.play despacito

O:
.reproducir https://youtu.be/XXXXXXXXXXX`,
      metro
    )
  }

  intentar {
    si (typeof m.react === "function") {
      esperar m.react("ðŸ"Ž")
    }

    esperar respuesta de conexión(
      m.chat,
      `ðŸ”Ž Buscando en YouTube...`,
      metro
    )

    const resultado = await searchYoutube(entrada)

    si (!resultado) {
      si (typeof m.react === "function") {
        await m.react("â Œ")
      }

      devolver conn.reply(
        m.chat,
        "â Œ No encontré ningún video con esa búsqueda.",
        metro
      )
    }

    esperar respuesta de conexión(
      m.chat,
      `ðŸŽµ *${result.title}*\n\nðŸ'¤ ${result.author}\nâ ±ï¸ ${result.duration}\n\nâ ³ Convirtiendo a MP3...`,
      metro
    )

    si (typeof m.react === "function") {
      await m.react("â ³")
    }

    const json = await downloadYoutube(result.url)
    const título = cleanFileName(json.título || resultado.título)

    esperar conn.sendMessage(
      m.chat,
      {
        audio: { url: json.dl },
        Nombre del archivo: `${título}.mp3`,
        tipo MIME: "audio/mpeg",
        ptt: falso
      },
      { citado: m }
    )

    si (typeof m.react === "function") {
      esperar m.react("âœ…")
    }

    console.log(`[PLAY] ENVIADO: ${title}`)
  } catch (error) {
    console.error("========== ERROR DE REPRODUCCIÓN ==========")
    consola.error(error)
    console.error("================================")

    si (typeof m.react === "function") {
      await m.react("â Œ")
    }

    devolver conn.reply(
      m.chat,
      `â Œ *No pude descargar el audio.*

${error?.message || String(error)}`,
      metro
    )
  }
}

handler.command = /^(play|song|musica|música)$/i
handler.help = ["reproducir <canción o enlace>"]
manejador.etiquetas = ["medios"]
controlador.límite = falso

exportar controlador predeterminado