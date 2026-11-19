// Cifrado de las contraseñas de las bases de cada institución (AES-256-GCM).
import crypto from 'node:crypto';

const clave = () => {
  const secreto = process.env.PLATAFORMA_SECRET || process.env.JWT_SECRET;
  if (!secreto) throw new Error('Falta PLATAFORMA_SECRET (o JWT_SECRET) para cifrar credenciales');
  return crypto.createHash('sha256').update(`segedu-plataforma:${secreto}`).digest();
};

export const cifrar = (texto) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', clave(), iv);
  const datos = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), datos.toString('base64')].join(':');
};

export const descifrar = (valor) => {
  const [v, iv, tag, datos] = String(valor).split(':');
  if (v !== 'v1') throw new Error('Formato de credencial cifrada desconocido');
  const d = crypto.createDecipheriv('aes-256-gcm', clave(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(datos, 'base64')), d.final()]).toString('utf8');
};

export const contrasenaAleatoria = (largo = 20) => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(largo);
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
};
