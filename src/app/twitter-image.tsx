import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'Cleo - Assistente Financeiro com IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public', 'icon-512.png'));
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#09090b',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text -- OG image generation doesn't support alt */}
        <img
          src={logoBase64}
          width={120}
          height={120}
          style={{ borderRadius: 28, marginBottom: 32 }}
        />
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 16 }}>
          Cleo
        </div>
        <div style={{ fontSize: 28, color: '#a1a1aa', maxWidth: 600, textAlign: 'center' }}>
          Sua assistente financeira com inteligência artificial
        </div>
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 48,
            fontSize: 18,
            color: '#4CB96B',
          }}
        >
          <span>Open Finance</span>
          <span>&#x2022;</span>
          <span>IA Contextual</span>
          <span>&#x2022;</span>
          <span>Projeções</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
