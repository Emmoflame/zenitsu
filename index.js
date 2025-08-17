import pkg from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal' // ⬅️ مكتبة QR المرئي

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = pkg

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('🔄 امسح كود QR التالي لتسجيل الدخول:')
      qrcode.generate(qr, { small: true }) // ⬅️ طباعة كود مرئي
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ الاتصال مغلق. إعادة الاتصال:', shouldReconnect)
      if (shouldReconnect) {
        startBot()
      } else {
        console.log('🚪 تم تسجيل الخروج. احذف مجلد auth_info لإعادة التسجيل.')
      }
    } else if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!')
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()
