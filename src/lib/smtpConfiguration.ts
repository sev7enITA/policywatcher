export function smtpConfiguration(env: Record<string, string | undefined>) {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = env;
  if (!host || !env.SMTP_PORT || !user || !pass) return null;
  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT is invalid.');
  return { host, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user, pass }, connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000 };
}
