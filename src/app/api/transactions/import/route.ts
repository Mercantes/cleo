import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const separator = header.includes(';') ? ';' : ',';
  const columns = header.split(separator).map(c => c.trim().replace(/"/g, ''));

  // Try to detect column positions
  const dateIdx = columns.findIndex(c => /^(data|date)$/i.test(c));
  const descIdx = columns.findIndex(c => /^(descri|description|hist|memo|lancamento)/.test(c));
  const amountIdx = columns.findIndex(c => /^(valor|amount|value|quantia)$/i.test(c));
  const typeIdx = columns.findIndex(c => /^(tipo|type)$/i.test(c));

  if (dateIdx === -1 || amountIdx === -1) return [];

  const results: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));

    const rawDate = cols[dateIdx];
    const rawAmount = cols[amountIdx];
    const description = descIdx >= 0 ? cols[descIdx] : `Transação ${i}`;

    // Parse date (DD/MM/YYYY or YYYY-MM-DD)
    let date: string;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('/');
      date = `${y}-${m}-${d}`;
    } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      date = rawDate.substring(0, 10);
    } else {
      continue; // Skip unparseable dates
    }

    // Parse amount (handle R$ prefix, comma as decimal)
    const cleanAmount = rawAmount
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '') // Remove thousands separator
      .replace(',', '.') // Convert decimal separator
      .trim();

    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount === 0) continue;

    let type: 'credit' | 'debit';
    if (typeIdx >= 0) {
      const rawType = cols[typeIdx].toLowerCase();
      type = rawType.includes('cred') || rawType.includes('entrada') ? 'credit' : 'debit';
    } else {
      type = amount > 0 ? 'credit' : 'debit';
    }

    results.push({
      date,
      description: description.substring(0, 255),
      amount: Math.abs(amount),
      type,
    });
  }

  return results;
}

function parseOFX(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = txRegex.exec(text)) !== null) {
    const block = match[1];

    const typeMatch = block.match(/<TRNTYPE>(\w+)/);
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = block.match(/<TRNAMT>([+-]?[\d.]+)/);
    const memoMatch = block.match(/<MEMO>([^<]+)/) || block.match(/<NAME>([^<]+)/);

    if (!dateMatch || !amountMatch) continue;

    const rawDate = dateMatch[1];
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const amount = parseFloat(amountMatch[1]);
    const trnType = typeMatch?.[1]?.toUpperCase() || '';
    const type: 'credit' | 'debit' = (trnType === 'CREDIT' || amount > 0) ? 'credit' : 'debit';

    results.push({
      date,
      description: (memoMatch?.[1] || `Transação OFX`).trim().substring(0, 255),
      amount: Math.abs(amount),
      type,
    });
  }

  return results;
}

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const text = await file.text();
  const fileName = file.name.toLowerCase();

  let parsed: ParsedTransaction[];

  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    parsed = parseCSV(text);
  } else if (fileName.endsWith('.ofx') || fileName.endsWith('.qfx')) {
    parsed = parseOFX(text);
  } else {
    return NextResponse.json({ error: 'Formato não suportado. Use CSV, TXT, OFX ou QFX.' }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo' }, { status: 400 });
  }

  // Preview mode - return parsed data without inserting
  const preview = formData.get('preview');
  if (preview === 'true') {
    return NextResponse.json({
      preview: true,
      count: parsed.length,
      transactions: parsed.slice(0, 20), // Show first 20 for preview
      total: {
        income: parsed.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
        expenses: parsed.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
      },
    });
  }

  // Insert transactions in batches of 50
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < parsed.length; i += batchSize) {
    const batch = parsed.slice(i, i + batchSize).map(tx => ({
      user_id: user.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      source: 'import',
    }));

    const { error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from('transactions')
      .insert(batch);
    if (error) {
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({
    success: true,
    imported: inserted,
    errors,
    total: parsed.length,
  });
});
