import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadXlsx } from "@/lib/xlsx-export";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ClientTag = { id: string; name: string; color: string };

type BusinessClient = {
  id: string;
  owner_id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  is_blocked: boolean;
  created_at: string;
  total_purchases: number;
  total_spent_pen: number;
  last_purchase: string | null;
  tags: ClientTag[];
};

type ClientMetrics = {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  blocked_clients: number;
};

type Owner = { owner_id: string; display_name: string };

type ClientDraft = {
  nombre: string;
  telefono: string;
  email: string;
  is_blocked: boolean;
  tagIds: string[];
};

type ClientStatusFilter = "all" | "active" | "inactive" | "blocked";
type ClientDateFilter = "all" | "30d" | "90d" | "year";

const CLIENTS_PAGE_SIZE = 10;

const EMPTY_DRAFT: ClientDraft = {
  nombre: "",
  telefono: "",
  email: "",
  is_blocked: false,
  tagIds: [],
};

function normalizeTags(value: unknown): ClientTag[] {
  return Array.isArray(value)
    ? value.filter(
        (tag): tag is ClientTag =>
          typeof tag === "object" &&
          tag !== null &&
          typeof (tag as ClientTag).id === "string" &&
          typeof (tag as ClientTag).name === "string",
      )
    : [];
}

function isActive(lastPurchase: string | null) {
  return Boolean(lastPurchase && new Date(lastPurchase).getTime() >= Date.now() - 30 * 86_400_000);
}

function formatCurrency(value: number, hidden: boolean) {
  if (hidden) return "S/ •••";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sin compras";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value));
}

export function ClientsPanel({
  userId,
  isAdmin,
  isProvider,
  isDistributor,
  onGoShop,
}: {
  userId: string;
  isAdmin: boolean;
  isProvider: boolean;
  isDistributor: boolean;
  onGoShop: () => void;
}) {
  const queryClient = useQueryClient();
  const canManage = isAdmin || isProvider || isDistributor;
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<ClientDateFilter>("all");
  const [page, setPage] = useState(1);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<BusinessClient | null>(null);
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_DRAFT);
  const [newTagName, setNewTagName] = useState("");
  const [saving, setSaving] = useState(false);

  const scopeOwnerId = isAdmin ? ownerFilter : userId;
  const formOwnerId = editingClient?.owner_id ?? scopeOwnerId ?? userId;

  const clientsQuery = useQuery({
    queryKey: ["business-clients", scopeOwnerId],
    enabled: canManage,
    queryFn: async (): Promise<BusinessClient[]> => {
      const { data, error } = await supabase.rpc("get_business_clients", {
        p_owner_id: scopeOwnerId,
      });
      if (error) throw error;
      return (data ?? []).map((client) => ({ ...client, tags: normalizeTags(client.tags) }));
    },
  });

  const metricsQuery = useQuery({
    queryKey: ["business-client-metrics", scopeOwnerId],
    enabled: canManage,
    queryFn: async (): Promise<ClientMetrics> => {
      const { data, error } = await supabase.rpc("get_business_client_metrics", {
        p_owner_id: scopeOwnerId,
      });
      if (error) throw error;
      return data?.[0] ?? {
        total_clients: 0,
        active_clients: 0,
        inactive_clients: 0,
        blocked_clients: 0,
      };
    },
  });

  const ownersQuery = useQuery({
    queryKey: ["business-client-owners"],
    enabled: isAdmin,
    queryFn: async (): Promise<Owner[]> => {
      const { data, error } = await supabase.rpc("get_business_client_owners");
      if (error) throw error;
      return data ?? [];
    },
  });

  const tagsQuery = useQuery({
    queryKey: ["business-client-tags", formOwnerId],
    enabled: canManage && Boolean(formOwnerId),
    queryFn: async (): Promise<ClientTag[]> => {
      const { data, error } = await supabase
        .from("business_client_tags")
        .select("id, name, color")
        .eq("owner_id", formOwnerId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const clients = clientsQuery.data ?? [];
  const metrics = metricsQuery.data ?? {
    total_clients: 0,
    active_clients: 0,
    inactive_clients: 0,
    blocked_clients: 0,
  };
  const tags = tagsQuery.data ?? [];
  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    const minimumRegistrationDate =
      dateFilter === "30d"
        ? Date.now() - 30 * 86_400_000
        : dateFilter === "90d"
          ? Date.now() - 90 * 86_400_000
          : dateFilter === "year"
            ? new Date(new Date().getFullYear(), 0, 1).getTime()
            : null;

    return clients.filter((client) => {
      const status = client.is_blocked ? "blocked" : isActive(client.last_purchase) ? "active" : "inactive";
      const matchesSearch =
        !normalized ||
        [client.nombre, client.telefono, client.email].some((value) =>
          value?.toLocaleLowerCase("es").includes(normalized),
        );
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesRegistrationDate =
        minimumRegistrationDate === null || new Date(client.created_at).getTime() >= minimumRegistrationDate;

      return matchesSearch && matchesStatus && matchesRegistrationDate;
    });
  }, [clients, dateFilter, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * CLIENTS_PAGE_SIZE;
  const visibleClients = filteredClients.slice(pageStart, pageStart + CLIENTS_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dateFilter, scopeOwnerId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["business-clients"] }),
      queryClient.invalidateQueries({ queryKey: ["business-client-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["business-client-owners"] }),
    ]);
  };

  const openCreate = () => {
    setEditingClient(null);
    setDraft(EMPTY_DRAFT);
    setClientDialogOpen(true);
  };

  const openEdit = (client: BusinessClient) => {
    setEditingClient(client);
    setDraft({
      nombre: client.nombre,
      telefono: client.telefono ?? "",
      email: client.email ?? "",
      is_blocked: client.is_blocked,
      tagIds: client.tags.map((tag) => tag.id),
    });
    setClientDialogOpen(true);
  };

  const saveClient = async () => {
    if (draft.nombre.trim().length < 2) {
      toast.error("Ingresa el nombre del cliente.");
      return;
    }
    if (!formOwnerId) {
      toast.error("Selecciona el dueño de los clientes antes de guardar.");
      return;
    }

    setSaving(true);
    try {
      const values = {
        nombre: draft.nombre.trim(),
        telefono: draft.telefono.trim() || null,
        email: draft.email.trim().toLowerCase() || null,
        is_blocked: draft.is_blocked,
      };
      let clientId = editingClient?.id;
      if (editingClient) {
        const { error } = await supabase.from("business_clients").update(values).eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("business_clients")
          .insert({ ...values, owner_id: formOwnerId })
          .select("id")
          .single();
        if (error) throw error;
        clientId = data.id;
      }

      if (!clientId) throw new Error("No se pudo identificar el cliente guardado.");
      const { error: removeTagsError } = await supabase
        .from("business_client_tag_assignments")
        .delete()
        .eq("client_id", clientId);
      if (removeTagsError) throw removeTagsError;
      if (draft.tagIds.length > 0) {
        const { error: assignTagsError } = await supabase
          .from("business_client_tag_assignments")
          .insert(draft.tagIds.map((tagId) => ({ client_id: clientId, tag_id: tagId })));
        if (assignTagsError) throw assignTagsError;
      }

      toast.success(editingClient ? "Cliente actualizado." : "Cliente registrado.");
      setClientDialogOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (client: BusinessClient) => {
    try {
      const { error } = await supabase
        .from("business_clients")
        .update({ is_blocked: !client.is_blocked })
        .eq("id", client.id);
      if (error) throw error;
      toast.success(client.is_blocked ? "Cliente desbloqueado." : "Cliente bloqueado.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    }
  };

  const deleteClient = async (client: BusinessClient) => {
    if (client.total_purchases > 0) {
      toast.error("No se puede eliminar un cliente con compras. Puedes bloquearlo en su lugar.");
      return;
    }
    if (!window.confirm(`¿Eliminar a ${client.nombre}?`)) return;
    try {
      const { error } = await supabase.from("business_clients").delete().eq("id", client.id);
      if (error) throw error;
      toast.success("Cliente eliminado.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cliente.");
    }
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name || !formOwnerId) return;
    try {
      const { error } = await supabase
        .from("business_client_tags")
        .insert({ owner_id: formOwnerId, name });
      if (error) throw error;
      setNewTagName("");
      toast.success("Etiqueta creada.");
      await queryClient.invalidateQueries({ queryKey: ["business-client-tags", formOwnerId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la etiqueta.");
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase.from("business_client_tags").delete().eq("id", tagId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["business-client-tags", formOwnerId] });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la etiqueta.");
    }
  };

  const renameTag = async (tag: ClientTag) => {
    const name = window.prompt("Nombre de la etiqueta", tag.name)?.trim();
    if (!name || name === tag.name) return;
    try {
      const { error } = await supabase
        .from("business_client_tags")
        .update({ name })
        .eq("id", tag.id);
      if (error) throw error;
      toast.success("Etiqueta actualizada.");
      await queryClient.invalidateQueries({ queryKey: ["business-client-tags", formOwnerId] });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la etiqueta.");
    }
  };

  const exportExcel = () => {
    downloadXlsx(
      `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`,
      ["Nombre", "Teléfono / WhatsApp", "Email", "Fecha de registro", "Estado", "Pedidos", "Total comprado", "Última actividad", "Etiquetas"],
      filteredClients.map((client) => [
        client.nombre,
        client.telefono ?? "",
        client.email ?? "",
        formatDate(client.created_at),
        client.is_blocked ? "Bloqueado" : isActive(client.last_purchase) ? "Activo" : "Inactivo",
        client.total_purchases,
        client.total_spent_pen.toFixed(2),
        formatDate(client.last_purchase),
        client.tags.map((tag) => tag.name).join(", "),
      ]),
    );
    toast.success("Archivo Excel descargado.");
  };

  if (!canManage) {
    return (
      <section className="mx-auto mt-6 max-w-4xl px-4 pb-24 sm:px-6">
        <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-white/65">
          Esta sección está disponible solo para administrador, proveedor o distribuidor.
        </div>
      </section>
    );
  }

  const summaryCards = [
    { label: "Total Clientes", description: "Registrados en tu cuenta", value: metrics.total_clients, icon: Users },
    { label: "Activos", description: "Comprando regularmente", value: metrics.active_clients, icon: Check },
    { label: "Inactivos", description: "Sin compras recientes", value: metrics.inactive_clients, icon: EyeOff },
    { label: "Bloqueados", description: "Clientes problemáticos", value: metrics.blocked_clients, icon: X },
  ];

  return (
    <section className="mx-auto mt-6 max-w-[1600px] px-4 pb-24 sm:px-6">
      <header className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Mi negocio</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-white sm:text-4xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55 sm:text-base">
            Administra los contactos de tu negocio y prepara tus próximas ventas desde un solo lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoShop}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-background px-3.5 text-xs font-bold text-white/80 transition hover:border-primary/55 hover:text-white sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al catálogo
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, description, value, icon: Icon }) => (
          <div key={label} className="flex min-h-28 items-center justify-between rounded-xl border border-border bg-card/60 px-5 py-4">
            <div className="flex items-start gap-4">
              <Icon className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-base font-bold text-white">{label}</p>
                <p className="mt-1 text-sm text-white/50">{description}</p>
              </div>
            </div>
            <span className="font-display text-2xl text-white">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={openCreate} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </button>
        <button type="button" onClick={() => setTagsDialogOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-white/85 transition hover:border-primary/50 hover:text-white">
          <Tags className="h-4 w-4" /> Etiquetas
        </button>
        <button type="button" onClick={() => setHideAmounts((value) => !value)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-white/85 transition hover:border-primary/50 hover:text-white">
          {hideAmounts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {hideAmounts ? "Mostrar números" : "Ocultar números"}
        </button>
        <button type="button" onClick={exportExcel} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-white/85 transition hover:border-primary/50 hover:text-white">
          <Download className="h-4 w-4" /> Exportar Excel
        </button>
        {isAdmin && (
          <label className="ml-auto flex h-11 min-w-52 items-center rounded-lg border border-border bg-background px-3 text-sm text-white/75">
            <span className="mr-2 whitespace-nowrap text-white/45">Ver clientes de:</span>
            <select value={ownerFilter ?? ""} onChange={(event) => setOwnerFilter(event.target.value || null)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none">
              <option value="">Toda la plataforma</option>
              {(ownersQuery.data ?? []).map((owner) => <option key={owner.owner_id} value={owner.owner_id}>{owner.display_name}</option>)}
            </select>
          </label>
        )}
      </div>

      <label className="mt-5 flex h-14 items-center gap-3 rounded-lg border border-border bg-card/50 px-4 text-white/60 focus-within:border-primary/60">
        <Search className="h-5 w-5" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar clientes" className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" />
      </label>

      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border/70 bg-background/45 p-3 sm:flex-row sm:items-center">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-border bg-card/55 px-3 text-xs text-white/60 sm:w-52">
          <span className="shrink-0 font-semibold text-white/75">Estado</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClientStatusFilter)}
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </label>
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-border bg-card/55 px-3 text-xs text-white/60 sm:w-56">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as ClientDateFilter)}
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none"
            aria-label="Filtrar clientes por fecha de registro"
          >
            <option value="all">Todas las fechas</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="year">Este año</option>
          </select>
        </label>
        <p className="text-xs text-white/45 sm:ml-auto">
          {filteredClients.length} {filteredClients.length === 1 ? "cliente encontrado" : "clientes encontrados"}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card/40">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-border bg-background/70 text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Teléfono / WhatsApp</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Registro</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Pedidos / total</th><th className="px-4 py-3">Última actividad</th><th className="px-4 py-3">Etiquetas</th><th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {clientsQuery.isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/45"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando clientes…</td></tr>
              ) : clientsQuery.isError ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-primary">No se pudieron cargar los clientes. <button type="button" className="font-bold underline" onClick={() => void clientsQuery.refetch()}>Reintentar</button></td></tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Users className="h-5 w-5" aria-hidden="true" /></span>
                      <p className="mt-3 font-semibold text-white">{clients.length === 0 ? "Aún no registras clientes" : "No hay resultados para estos filtros"}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{clients.length === 0 ? "Crea tu primer cliente para agilizar la asignación de pedidos y conservar su historial." : "Prueba cambiando la búsqueda, el estado o la fecha de registro."}</p>
                      {clients.length === 0 && <button type="button" onClick={openCreate} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Registrar cliente</button>}
                    </div>
                  </td>
                </tr>
              ) : visibleClients.map((client) => {
                const status = client.is_blocked ? "Bloqueado" : isActive(client.last_purchase) ? "Activo" : "Inactivo";
                const statusClass = client.is_blocked ? "bg-red-500/10 text-red-300" : status === "Activo" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-200";
                return <tr key={client.id} className="transition-colors hover:bg-white/[0.025]">
                  <td className="px-4 py-3.5 font-semibold text-white">{client.nombre}</td>
                  <td className="px-4 py-3.5 text-white/65">{client.telefono || "—"}</td>
                  <td className="px-4 py-3.5 text-white/65">{client.email || "—"}</td>
                  <td className="px-4 py-3.5 text-white/65">{formatDate(client.created_at)}</td>
                  <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>{status}</span></td>
                  <td className="px-4 py-3.5"><p className="font-semibold text-white">{client.total_purchases} {client.total_purchases === 1 ? "pedido" : "pedidos"}</p><p className="mt-0.5 text-xs text-white/50">{formatCurrency(client.total_spent_pen, hideAmounts)}</p></td>
                  <td className="px-4 py-3.5 text-white/65">{formatDate(client.last_purchase)}</td>
                  <td className="px-4 py-3.5"><div className="flex flex-wrap gap-1.5">{client.tags.length ? client.tags.map((tag) => <span key={tag.id} style={{ borderColor: `${tag.color}80`, color: tag.color }} className="rounded-full border px-2 py-0.5 text-[10px] font-bold">{tag.name}</span>) : <span className="text-white/35">—</span>}</div></td>
                  <td className="px-4 py-3.5"><div className="flex justify-end gap-1.5"><button type="button" onClick={() => openEdit(client)} className="rounded-md border border-border p-2 text-white/60 transition hover:border-primary/60 hover:text-white" aria-label={`Editar ${client.nombre}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void toggleBlocked(client)} className="rounded-md border border-border p-2 text-white/60 transition hover:border-primary/60 hover:text-white" aria-label={client.is_blocked ? `Desbloquear ${client.nombre}` : `Bloquear ${client.nombre}`}>{client.is_blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => void deleteClient(client)} className="rounded-md border border-border p-2 text-white/60 transition hover:border-red-400/60 hover:text-red-300" aria-label={`Eliminar ${client.nombre}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {!clientsQuery.isLoading && !clientsQuery.isError && filteredClients.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/45">
              Mostrando {pageStart + 1}–{Math.min(pageStart + CLIENTS_PAGE_SIZE, filteredClients.length)} de {filteredClients.length} clientes
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-white/70 transition hover:border-primary/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-24 text-center text-xs font-semibold text-white/75">Página {currentPage} de {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-white/70 transition hover:border-primary/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle><DialogDescription>Guarda datos de contacto y etiquetas para tus próximas ventas.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nombre"><input value={draft.nombre} onChange={(event) => setDraft((value) => ({ ...value, nombre: event.target.value }))} placeholder="Nombre completo" className="crm-input" /></Field>
            <Field label="Teléfono / WhatsApp"><input value={draft.telefono} onChange={(event) => setDraft((value) => ({ ...value, telefono: event.target.value }))} placeholder="999 999 999" className="crm-input" /></Field>
            <Field label="Email (opcional)"><input type="email" value={draft.email} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} placeholder="cliente@correo.com" className="crm-input" /></Field>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card/60 px-3.5 py-3 text-sm"><span><span className="font-bold text-white">Bloquear cliente</span><span className="mt-0.5 block text-xs text-white/45">Impide identificarlo como activo.</span></span><input type="checkbox" checked={draft.is_blocked} onChange={(event) => setDraft((value) => ({ ...value, is_blocked: event.target.checked }))} className="h-4 w-4 accent-primary" /></label>
            <Field label="Etiquetas"><div className="flex flex-wrap gap-2">{tags.length ? tags.map((tag) => <label key={tag.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-white/75"><input type="checkbox" checked={draft.tagIds.includes(tag.id)} onChange={() => setDraft((value) => ({ ...value, tagIds: value.tagIds.includes(tag.id) ? value.tagIds.filter((id) => id !== tag.id) : [...value.tagIds, tag.id] }))} className="accent-primary" /><span style={{ color: tag.color }}>{tag.name}</span></label>) : <span className="text-xs text-white/40">Crea etiquetas desde el botón Etiquetas.</span>}</div></Field>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setClientDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-white/70">Cancelar</button><button type="button" disabled={saving} onClick={() => void saveClient()} className="inline-flex min-w-28 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}</button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Etiquetas</DialogTitle><DialogDescription>Categoriza tus clientes, por ejemplo VIP, Mayorista o Nuevo.</DialogDescription></DialogHeader>
          <div className="flex gap-2"><input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createTag(); } }} placeholder="Nueva etiqueta" className="crm-input" /><button type="button" onClick={() => void createTag()} className="rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground">Crear</button></div>
          <div className="max-h-64 space-y-2 overflow-y-auto py-2">{tags.length ? tags.map((tag) => <div key={tag.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"><span style={{ color: tag.color }} className="text-sm font-bold">{tag.name}</span><span className="flex gap-1"><button type="button" onClick={() => void renameTag(tag)} className="rounded p-1 text-white/45 hover:text-white" aria-label={`Editar etiqueta ${tag.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void deleteTag(tag.id)} className="rounded p-1 text-white/45 hover:text-red-300" aria-label={`Eliminar etiqueta ${tag.name}`}><Trash2 className="h-4 w-4" /></button></span></div>) : <p className="py-5 text-center text-sm text-white/45">Aún no hay etiquetas.</p>}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-white/85">{label}</span>{children}</label>;
}
