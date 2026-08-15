import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'mist_logo.png');
const logoBuffer = fs.readFileSync(logoPath);
const base64Str = logoBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64Str}`;

const tsContent = `export const DEFAULT_LOGO_BASE64 = "${dataUri}";\n`;
fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'logoBase64.ts'), tsContent);

console.log('✅ logoBase64.ts generated! Base64 Data URI length:', dataUri.length);
