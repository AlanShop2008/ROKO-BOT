import { execSync } from 'child_process'

let handler = async (m, { conn, text }) => {
  try {
    await m.react('🕓')

    global.isUpdating = true

    // =====================================================
    // 1. GUARDAR CAMBIOS LOCALES
    // =====================================================

    let stashCreated = false
    let stashName = `auto-update-${Date.now()}`

    try {
      const status = execSync('git status --porcelain', {
        encoding: 'utf-8'
      }).trim()

      if (status) {
        execSync(`git stash push -u -m "${stashName}"`, {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024 * 20
        })

        stashCreated = true
      }
    } catch (e) {
      console.log('⚠️ No se pudieron guardar los cambios locales:', e.message)
    }

    // =====================================================
    // 2. ACTUALIZAR DESDE GITHUB
    // =====================================================

    let command = 'git pull'

    if (m.fromMe && text) {
      command += ' ' + text
    }

    let stdout = ''

    try {
      stdout = execSync(command, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 20
      }).trim()

    } catch (pullError) {

      // Si git pull falla, intentamos recuperar el stash
      if (stashCreated) {
        try {
          execSync('git stash pop', {
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 20
          })
        } catch (restoreError) {
          console.log(
            '⚠️ Error al restaurar cambios:',
            restoreError.message
          )
        }
      }

      throw pullError
    }

    // =====================================================
    // 3. RECUPERAR CAMBIOS DEL USUARIO
    // =====================================================

    let restoreMessage = ''

    if (stashCreated) {

      try {

        const restored = execSync('git stash pop', {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024 * 20
        }).trim()

        restoreMessage =
          '\n\n💾 *Tus cambios locales fueron restaurados correctamente.*'

      } catch (restoreError) {

        restoreMessage =
          '\n\n⚠️ *Se encontraron conflictos al restaurar tus cambios locales.*' +
          `\n\n\`\`\`${restoreError.message}\`\`\``

        console.log(
          '⚠️ Conflicto al restaurar cambios:',
          restoreError.message
        )
      }
    }

    // =====================================================
    // 4. DETECTAR SI YA ESTABA ACTUALIZADO
    // =====================================================

    if (/Already up to date\.|Ya está actualizado\./i.test(stdout)) {

      global.isUpdating = false

      await conn.reply(
        m.chat,
        `💫 *YA ESTÁ ACTUALIZADO.*

\`\`\`${stdout}\`\`\`${restoreMessage}`,
        m
      )

      return await m.react('✅')
    }

    // =====================================================
    // 5. ARCHIVOS ACTUALIZADOS
    // =====================================================

    let changed = ''

    try {

      changed = execSync(
        'git diff --name-only HEAD@{1} HEAD',
        {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024 * 20
        }
      ).trim()

    } catch {

      changed = ''
    }

    // =====================================================
    // 6. RECARGAR PLUGINS
    // =====================================================

    let pluginsCount = Object.keys(
      global.plugins || {}
    ).length

    if (global.filesInit) {

      try {

        await global.filesInit('commands')

        pluginsCount = Object.keys(
          global.plugins || {}
        ).length

      } catch (e) {

        console.log(
          '⚠️ Error recargando plugins:',
          e.message
        )
      }
    }

    // =====================================================
    // 7. DETECTAR ARCHIVOS PRINCIPALES
    // =====================================================

    const coreTouched =
      changed &&
      changed
        .split('\n')
        .some((f) =>
          /^(index\.js|handler\.js|config\.js|lib\/|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)/i
            .test(f.trim())
        )

    global.isUpdating = false

    // =====================================================
    // 8. RESPUESTA
    // =====================================================

    let replyText =
      `《★》 *ACTUALIZADO CON ÉXITO ✔*

` +
      `🪐 *Resultado de Git:*
\`\`\`
${stdout}
\`\`\`

` +
      `🌙 *Plugins cargados:* ${pluginsCount}`

    if (changed) {

      const list = changed
        .split('\n')
        .filter(Boolean)

      replyText +=
        `\n\n🍭 *Archivos actualizados (${list.length}):*\n` +
        list
          .slice(0, 35)
          .map(x => `• ${x}`)
          .join('\n')

      if (list.length > 35) {
        replyText += `\n• ...`
      }
    }

    if (coreTouched) {

      replyText +=
        `\n\n⚠️ *Se detectaron cambios en archivos principales.*` +
        `\nPara aplicar todo correctamente, se recomienda reiniciar el bot.`
    }

    replyText += restoreMessage

    await conn.reply(
      m.chat,
      replyText,
      m
    )

    await m.react('✅')

  } catch (e) {

    global.isUpdating = false

    const errorMessage = String(
      e?.stderr ||
      e?.message ||
      e
    )

    let extra = ''

    if (
      /local changes|would be overwritten|conflict|conflicto/i
        .test(errorMessage)
    ) {
      extra =
        `\n\n⚠️ *Git encontró un conflicto con archivos locales.*` +
        `\nNo se borraron automáticamente tus archivos.`
    }

    await conn.reply(
      m.chat,
      `🌙 *ERROR AL ACTUALIZAR:*

\`\`\`
${errorMessage}
\`\`\`${extra}`,
      m
    )

    await m.react('❌')

    console.error(
      '❌ Error en .update:',
      e
    )
  }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = [
  'update',
  'actualizar',
  'fix',
  'fixed'
]

handler.rowner = true

export default handler
