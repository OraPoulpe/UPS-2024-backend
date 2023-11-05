import 'dotenv/config';

export const token = process.env.TOKEN || '';

export const drop = Boolean(process.env.DROP) || false;