import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB.' }, { status: 400 });
  }

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const filePath = `${user.id}/avatar.${ext}`;

  // Upload to Supabase Storage (upsert to replace existing)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Erro ao fazer upload do avatar' }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update profile with avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
});

export const DELETE = withAuth(async (_request, { supabase, user }) => {
  // List files in user's avatar folder
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(user.id);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from('avatars').remove(filePaths);
  }

  // Clear avatar URL in profile
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao remover avatar' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
