"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { TaxonomyItem, TaxonomyKind } from "@/lib/taxonomy-service";
import { taxonomyNameSchema, type TaxonomyNameInput } from "@/lib/validation";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Field";
import ActionMenu, { type RowAction } from "./ActionMenu";
import AdminTabs from "./AdminTabs";
import ImportTaxonomyModal from "./ImportTaxonomyModal";

type CopyDeck = {
  /** "Role" / "Venue" */
  singular: string;
  /** "Roles" / "Venues" */
  plural: string;
  eyebrow: string;
  blurb: string;
  placeholder: string;
};

const COPY: Record<TaxonomyKind, CopyDeck> = {
  roles: {
    singular: "Role",
    plural: "Roles",
    eyebrow: "Directory · Roles",
    blurb: "Job titles assignable to staff. Renaming one updates every staff member who holds it.",
    placeholder: "Front Desk Supervisor",
  },
  venues: {
    singular: "Venue",
    plural: "Venues",
    eyebrow: "Directory · Venues",
    blurb: "Places staff can be assigned to. Renaming one updates every staff member posted there.",
    placeholder: "Lagos — Ikeja",
  },
};

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20h4l10-10a2.8 2.8 0 10-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

/**
 * CRUD for one of the two assignable taxonomies. Roles and Venues are the same
 * shape end to end, so this component is parameterised by `kind` rather than
 * duplicated.
 *
 * Search is client-side here, unlike the staff directory: these lists are small
 * and bounded (tens of entries, not thousands), so paginating them server-side
 * would be machinery with nothing to do.
 */
export default function TaxonomyTable({ kind }: { kind: TaxonomyKind }) {
  const copy = COPY[kind];
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [query, setQuery] = useState("");
  /** null = closed; { id: null } = creating; { id } = renaming. */
  const [editing, setEditing] = useState<{ id: string | null; name: string } | null>(null);
  const [deleting, setDeleting] = useState<TaxonomyItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const list = useQuery({
    queryKey: ["admin", "taxonomy", kind],
    queryFn: () => apiClient.get<{ items: TaxonomyItem[] }>(`/api/admin/taxonomy/${kind}`),
  });

  const items = useMemo(() => {
    const all = list.data?.items ?? [];
    const q = query.trim().toLowerCase();
    return q ? all.filter((i) => i.name.toLowerCase().includes(q)) : all;
  }, [list.data, query]);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<TaxonomyNameInput>({
    resolver: zodResolver(taxonomyNameSchema),
    defaultValues: { name: "" },
    values: { name: editing?.name ?? "" },
    mode: "onTouched",
  });

  const closeEditor = () => {
    setEditing(null);
    reset({ name: "" });
  };

  const invalidate = () => {
    // Also refreshes `meta`, which feeds the role/venue pickers on staff forms.
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const save = useMutation({
    mutationFn: ({ id, name }: { id: string | null; name: string }) =>
      id
        ? apiClient.patch<TaxonomyItem>(`/api/admin/taxonomy/${kind}/${id}`, { name })
        : apiClient.post<TaxonomyItem>(`/api/admin/taxonomy/${kind}`, { name }),
    onSuccess: (_data, variables) => {
      invalidate();
      pushToast(variables.id ? `${copy.singular} renamed.` : `${copy.singular} created.`);
      closeEditor();
    },
    onError: (error) =>
      setError("name", {
        type: "server",
        message:
          error instanceof ApiClientError ? error.message : `Couldn't save that ${copy.singular.toLowerCase()}.`,
      }),
  });

  const remove = useMutation({
    mutationFn: (item: TaxonomyItem) =>
      apiClient.delete<{ deleted: true }>(`/api/admin/taxonomy/${kind}/${item.id}`),
    onSuccess: (_data, item) => {
      invalidate();
      pushToast(`"${item.name}" deleted.`);
      setDeleting(null);
    },
    onError: (error) => {
      // A 409 here means it's still assigned — the message names the count.
      pushToast(
        error instanceof ApiClientError ? error.message : "Couldn't delete that.",
        "error",
      );
      setDeleting(null);
    },
  });

  const rowActions = (item: TaxonomyItem): RowAction[] => [
    {
      label: "Rename",
      icon: <EditIcon />,
      onClick: () => setEditing({ id: item.id, name: item.name }),
    },
    {
      label: "Delete",
      icon: <TrashIcon />,
      danger: true,
      onClick: () => setDeleting(item),
    },
  ];

  const total = list.data?.items.length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.plural}
        meta={list.data ? `${total} ${total === 1 ? copy.singular.toLowerCase() : copy.plural.toLowerCase()}` : "Loading…"}
      />

      <div className="mt-5">
        <AdminTabs />
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-muted">{copy.blurb}</p>

      <div className="mt-5 overflow-hidden rounded-2xl bg-paper shadow-card">
        <div className="flex flex-col gap-3 border-b border-paper-sunken px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="w-full lg:max-w-xs">
            <Input
              placeholder={`Search ${copy.plural.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${copy.plural.toLowerCase()}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-paper-sunken px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-paper-sunken"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              Import CSV
            </button>

            <Button size="sm" onClick={() => setEditing({ id: null, name: "" })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New {copy.singular}
            </Button>
          </div>
        </div>

        {list.isPending ? (
          <div className="divide-y divide-paper-sunken">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <Message
            title={`Couldn't load ${copy.plural.toLowerCase()}`}
            body="Something went wrong fetching the list."
            action={<Button size="sm" onClick={() => list.refetch()}>Try again</Button>}
          />
        ) : items.length === 0 ? (
          <Message
            title={query ? "No matches" : `No ${copy.plural.toLowerCase()} yet`}
            body={
              query
                ? `No ${copy.singular.toLowerCase()} matches that search.`
                : `Create your first ${copy.singular.toLowerCase()} to start assigning it.`
            }
            action={
              query ? (
                <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button size="sm" onClick={() => setEditing({ id: null, name: "" })}>
                  New {copy.singular}
                </Button>
              )
            }
          />
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">{copy.singular}</th>
                <th className="px-3 py-2.5 font-semibold">Assigned staff</th>
                <th className="px-5 py-2.5 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-paper-sunken text-[13.5px] transition-colors hover:bg-paper-soft"
                >
                  <td className="px-5 py-3 font-semibold text-ink">{item.name}</td>
                  <td className="px-3 py-3 text-ink-soft">
                    {item.staffCount === 0 ? (
                      <span className="text-ink-muted">Unassigned</span>
                    ) : (
                      `${item.staffCount} ${item.staffCount === 1 ? "member" : "members"}`
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <ActionMenu actions={rowActions(item)} label={`Actions for ${item.name}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={closeEditor}
        title={editing?.id ? `Rename ${copy.singular.toLowerCase()}` : `New ${copy.singular.toLowerCase()}`}
        description={
          editing?.id
            ? `Every staff member holding this ${copy.singular.toLowerCase()} follows the new name automatically.`
            : `Adds a ${copy.singular.toLowerCase()} that can be assigned to staff.`
        }
      >
        <form
          onSubmit={handleSubmit(({ name }) =>
            save.mutate({ id: editing?.id ?? null, name }),
          )}
        >
          <Input
            id="taxonomy-name"
            label={`${copy.singular} name`}
            error={errors.name?.message}
            placeholder={copy.placeholder}
            autoFocus
            {...register("name")}
          />

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              {editing?.id ? "Save changes" : `Create ${copy.singular.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Modal>

      <ImportTaxonomyModal
        kind={kind}
        singular={copy.singular}
        plural={copy.plural}
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${copy.singular.toLowerCase()}?`}
        tone="danger"
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        description={
          deleting?.staffCount ? (
            <>
              <strong className="font-semibold text-ink">{deleting.name}</strong> is assigned
              to {deleting.staffCount}{" "}
              {deleting.staffCount === 1 ? "staff member" : "staff members"}. Deleting is
              blocked until they are reassigned.
            </>
          ) : (
            <>
              <strong className="font-semibold text-ink">{deleting?.name}</strong> will be
              removed. It isn&apos;t assigned to anyone, so no staff record changes.
            </>
          )
        }
      />
    </div>
  );
}

function Message({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
