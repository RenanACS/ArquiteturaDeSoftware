const fs = require('fs')
const path = require('path')
const selfsigned = require('selfsigned')

const certificatesDir = path.join(__dirname, 'certificates')
const keyPath = path.join(certificatesDir, 'key.pem')
const certPath = path.join(certificatesDir, 'cert.pem')

async function ensureCertificates() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath }
  }

  fs.mkdirSync(certificatesDir, { recursive: true })

  const attrs = [{ name: 'commonName', value: 'localhost' }]
  const pems = await selfsigned.generate(attrs, {
    algorithm: 'sha256',
    days: 365,
    keySize: 2048,
    extensions: [
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' }
        ]
      }
    ]
  })

  fs.writeFileSync(keyPath, pems.private)
  fs.writeFileSync(certPath, pems.cert)

  return { keyPath, certPath }
}

module.exports = { ensureCertificates, keyPath, certPath }

if (require.main === module) {
  ensureCertificates()
    .then(() => {
      console.log('Certificados criados com sucesso!')
    })
    .catch((err) => {
      console.error('Erro ao gerar certificados:', err)
      process.exitCode = 1
    })
}
