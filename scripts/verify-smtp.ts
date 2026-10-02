/** Authentication/TLS probe only. Does not send a message or contact subscribers. */
import nodemailer from 'nodemailer';
import { smtpConfiguration } from '../src/lib/smtpConfiguration';

async function verify() {
  const config = smtpConfiguration(process.env);
  if (!config) throw new Error('missing_configuration');
  const transport = nodemailer.createTransport(config);
  try {
    await transport.verify();
    console.log(JSON.stringify({ verified: true, host: config.host, port: config.port, tlsRequired: true, messagesSent: 0 }));
  } finally {
    transport.close();
  }
}
verify().catch((error: unknown) => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'configuration_or_verification_failed';
  console.error(JSON.stringify({ verified: false, code, messagesSent: 0 }));
  process.exitCode = 1;
});
