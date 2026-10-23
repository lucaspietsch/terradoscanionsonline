import { randomBytes } from 'node:crypto';
console.log('# Cole no seu .env de produção (NUNCA commite). Guarde um backup em cofre separado:');
console.log('# perder a MASTER_KEY = perder acesso aos dados pessoais cifrados.');
console.log(`MASTER_KEY=${randomBytes(32).toString('base64')}`);
