import { getSupabaseClient } from '../config/supabase.js';

export type MemberRecord = {
  id: string;
  name: string | null;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'inactive';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export class MemberServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'MemberServiceError';
  }
}

const SELECT_FIELDS = 'id, name, email, role, status, avatar_url, created_at, updated_at';

export async function listMembers(): Promise<MemberRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as MemberRecord[]) ?? [];
}

export async function createMember(
  name: string,
  email: string,
  role: 'owner' | 'member'
): Promise<MemberRecord> {
  const supabase = getSupabaseClient();

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    throw new MemberServiceError('E-mail já cadastrado na plataforma.', 'DUPLICATE_EMAIL');
  }

  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email);

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already been registered') || msg.includes('already exists')) {
      throw new MemberServiceError('E-mail já cadastrado na plataforma.', 'DUPLICATE_EMAIL');
    }
    throw authError;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ name, role })
    .eq('id', authData.user.id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data as MemberRecord;
}

export async function updateMember(
  id: string,
  updates: { name?: string; role?: 'owner' | 'member' }
): Promise<MemberRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select(SELECT_FIELDS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new MemberServiceError('Membro não encontrado.', 'NOT_FOUND');
  return data as MemberRecord;
}

export async function deleteMember(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) {
    throw new MemberServiceError('Não é possível remover a própria conta.', 'SELF_DELETE');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
}
