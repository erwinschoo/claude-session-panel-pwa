import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4317),
  host: process.env.HOST ?? '127.0.0.1',
  authToken: process.env.AUTH_TOKEN?.trim() || '',
  codeBin: process.env.CODE_BIN?.trim() || 'code',
};

/** Localhost-binding heeft geen token nodig; elke andere bind wél. */
export const isLocalOnly =
  config.host === '127.0.0.1' || config.host === 'localhost' || config.host === '::1';
