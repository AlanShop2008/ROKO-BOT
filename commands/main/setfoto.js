import fs from 'fs'

let handler = async (m, { conn, usedPrefix, command }) => {

  // Solo dueño
  if (!global.owner.includes(m.sender.split('@')[0])) {
    return conn.reply(m.chat, '❌ Este comando solo lo puede usar el dueño del bot.', m)
  }

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!mime.includes('image')) {
    return conn.reply(m.chat, `📸 Responde a una imagen con el comando:\n\n${usedPrefix + command}`, m)
  }

  try {
    let img = await q.download()

    await conn.updateProfilePicture(conn.user.jid, img)

    await conn.reply(m.chat, '✅ Foto de perfil del bot actualizada correctamente.', m)

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '❌ No se pudo cambiar la foto de perfil.', m)
  }
}

handler.help = ['setfoto']
handler.tags = ['tools']
handler.command = ['setfoto', 'fotobot']

export default handler