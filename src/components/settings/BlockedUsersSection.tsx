import { useState, useEffect, useCallback } from "react";
import { ShieldBan, Loader2, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

const PAGE_SIZE = 10;
const MAX_BLOCKED = 50;

export function BlockedUsersSection() {
  const { user } = useAuth();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const totalPages = Math.ceil(blockedTotal / PAGE_SIZE);

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const offset = page * PAGE_SIZE;

    const [{ count }, { data }] = await Promise.all([
      supabase.from("blocked_users").select("id", { count: "exact", head: true }).eq("blocker_id", user.id),
      supabase.from("blocked_users").select("id, blocked_id, created_at").eq("blocker_id", user.id)
        .order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
    ]);

    setBlockedTotal(count ?? 0);

    if (data) {
      const enriched: BlockedUser[] = await Promise.all(
        data.map(async (b) => {
          const { data: profile } = await supabase
            .from("profiles").select("username, avatar_url").eq("user_id", b.blocked_id).single();
          return { ...b, profile: profile ?? undefined };
        })
      );
      setBlockedUsers(enriched);
    }

    setLoading(false);
  }, [user, page]);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  async function handleUnblock(blockId: string) {
    setUnblockingId(blockId);
    const { error } = await supabase.from("blocked_users").delete().eq("id", blockId);
    if (error) {
      toast.error("Erro ao desbloquear jogador.");
    } else {
      toast.success("Jogador desbloqueado.");
      fetchBlocked();
    }
    setUnblockingId(null);
  }

  return (
    <section className="border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-5 py-3 bg-muted/30">
        <h2 className="font-display text-sm tracking-widest text-muted-foreground flex items-center gap-2">
          <ShieldBan className="h-4 w-4" />
          Usuários Bloqueados
          <span className="text-xs text-muted-foreground/60">({blockedTotal}/{MAX_BLOCKED})</span>
        </h2>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário bloqueado.</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary shrink-0">
                  {b.profile?.avatar_url ? (
                    <img src={b.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    b.profile?.username?.slice(0, 2).toUpperCase() ?? "??"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.profile?.username ?? "Jogador"}</p>
                </div>
                <button
                  onClick={() => handleUnblock(b.id)}
                  disabled={unblockingId === b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  {unblockingId === b.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <UserX className="h-4 w-4" />}
                  <span className="font-display tracking-wide">Desbloquear</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
