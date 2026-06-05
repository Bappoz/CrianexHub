export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  display_role?: string | null;
  status: 'active' | 'inactive';
  permissions?: Record<string, string[]>;
  last_sign_in_at?: string | null;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first || first === '') return '??';
  if (parts.length === 1) return first.substring(0, 2).toUpperCase();
  const last = parts[parts.length - 1];
  if (!last) return first.substring(0, 2).toUpperCase();

  const firstChar = first[0] ?? '';
  const lastChar = last[0] ?? '';
  return (firstChar + lastChar).toUpperCase();
}

export function filterMembers(
  members: Member[],
  filterStatus: 'Todos' | 'active' | 'inactive',
  filterRole: 'Todos' | 'owner' | 'member',
  searchQuery: string
): Member[] {
  const q = searchQuery.trim().toLowerCase();
  return members.filter((m) => {
    const matchStatus = filterStatus === 'Todos' || m.status === filterStatus;
    const matchRole = filterRole === 'Todos' || m.role === filterRole;
    const matchSearch =
      q === '' ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.display_role ?? '').toLowerCase().includes(q);
    return matchStatus && matchRole && matchSearch;
  });
}

export function formatLastAccess(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
