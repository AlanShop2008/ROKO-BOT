import fs from 'fs'
import path from 'path'

const DB_PATH = './storage/db/tienda.json'

function asegurarDB() {
  const dir = path.dirname(DB_PATH)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      activa: false,
      usuarios: {},
      productos: {},
      ventas: []
    }, null, 2))
  }
}

function leerDB() {
  asegurarDB()

  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

    if (typeof db.activa !== 'boolean') {
      db.activa = false
    }

    if (!db.usuarios) db.usuarios = {}
    if (!db.productos) db.productos = {}
    if (!db.ventas) db.ventas = []

    return db

  } catch {
    return {
      activa: false,
      usuarios: {},
      productos: {},
      ventas: []
    }
  }
}

function guardarDB(db) {
  asegurarDB()
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

let handler = async (m, { conn, isOwner }) => {

  if (!isOwner) {
    return conn.reply(
      m.chat,
      '❌ Este comando solamente puede utilizarlo el propietario del bot.',
      m
    )
  }

  const db = leerDB()

  db.activa = !db.activa

  guardarDB(db)

  if (db.activa) {

    await conn.reply(
      m.chat,
      `╭━━〔 🟢 𝐓𝐈𝐄𝐍𝐃𝐀 𝐀𝐂𝐓𝐈𝐕𝐀𝐃𝐀 〕━━╮

🛍️ La tienda ha sido activada correctamente.

Los usuarios ya pueden utilizar:

🛒 .tienda
💳 .saldo
📦 .comprar
📋 .miscompras

╰━━━━━━━━━━━━━━━━━━━━╯`,
      m
    )

  } else {

    await conn.reply(
      m.chat,
      `╭━━〔 🔴 𝐓𝐈𝐄𝐍𝐃𝐀 𝐃𝐄𝐒𝐀𝐂𝐓𝐈𝐕𝐀𝐃𝐀 〕━━╮

🛍️ La tienda ha sido desactivada.

Los comandos de tienda permanecerán
silenciosos hasta volver a activarla.

╰━━━━━━━━━━━━━━━━━━━━╯`,
      m
    )
  }
}

handler.help = ['activaronix']
handler.tags = ['owner']
handler.command = ['activaronix']

export default handler
