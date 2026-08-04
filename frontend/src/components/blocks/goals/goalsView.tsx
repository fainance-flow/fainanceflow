"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Badge from "@components/common/Badge";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import Icon, { resolveIcon } from "@components/common/Icon";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import GoalForm from "@components/blocks/forms/goalForm";
import { useGoals, useContributeToGoal, useDeleteGoal } from "@hooks/useGoals";
import { contributionSchema, type ContributionFormValues } from "@schemas/goal";
import { formatPKR, formatPKRCompact } from "@utils/currency";
import { daysUntil, formatDate } from "@utils/date";
import type { Goal } from "@utils/types";

const GoalsView = () => {
  const { data, isLoading } = useGoals();
  const contribute = useContributeToGoal();
  const remove = useDeleteGoal();
  const goals = data ?? [];

  const [contribTo, setContribTo] = useState<Goal | null>(null);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: 0, note: "" },
  });

  const onContribute = async (values: ContributionFormValues): Promise<void> => {
    if (!contribTo) return;
    try {
      const result = await contribute.mutateAsync({ id: contribTo.id, payload: values });
      if (result.data.justCompleted) {
        toast.success(`${contribTo.title} is fully funded!`);
      } else {
        toast.success(`Added ${formatPKR(values.amount)} to ${contribTo.title}.`);
      }
      reset();
      setContribTo(null);
    } catch {
      toast.error("Couldn't save that contribution.");
    }
  };

  const onConfirmDelete = async (): Promise<void> => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success(`Goal removed · ${confirmDelete.title}`);
      setConfirmDelete(null);
    } catch {
      toast.error("Couldn't delete the goal.");
    }
  };

  return (
    <PageLayout
      eyebrow="What you're saving toward"
      title={
        <>
          Your <em className="italic text-gold">goals</em>, in flight.
        </>
      }
      subtitle="Track every goal — from your next car to an emergency fund — with a clear deadline and progress bar."
      actions={
        <Button variant="gold" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New goal
        </Button>
      }
    >
      {isLoading ? (
        <LoadingOverlay rows={3} />
      ) : goals.length === 0 ? (
        <FallBackState
          icon={Target}
          title="No goals yet"
          description="Set a target — say PKR 1,500,000 for a car — and start chipping away."
          action={
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first goal
            </Button>
          }
        />
      ) : (
        <div className="ff-card-grid ff-card-grid--2 ff-stagger">
          {goals.map((g) => {
            const target = Number(g.targetAmount);
            const saved = Number(g.savedAmount);
            const pct = Math.min(Math.round((saved / target) * 1000) / 10, 100);
            const remaining = Math.max(target - saved, 0);
            const days = g.deadline ? daysUntil(g.deadline) : null;

            return (
              <article
                key={g.id}
                className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface p-7"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="h-12 w-12 rounded-xl bg-gold/12 text-gold grid place-items-center">
                    <Icon name={resolveIcon(g.icon)} className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        g.status === "completed"
                          ? "emerald"
                          : g.status === "paused"
                          ? "muted"
                          : "gold"
                      }
                      dot
                    >
                      {g.status}
                    </Badge>
                    <button
                      type="button"
                      aria-label={`Edit ${g.title}`}
                      title="Edit goal"
                      onClick={() => setEditGoal(g)}
                      className="h-8 w-8 grid place-items-center rounded-md border border-line-strong text-muted hover:border-gold/40 hover:text-ink transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${g.title}`}
                      title="Delete goal"
                      onClick={() => setConfirmDelete(g)}
                      className="h-8 w-8 grid place-items-center rounded-md border border-line-strong text-muted hover:border-terra/40 hover:text-terra transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-display text-2xl">{g.title}</h3>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-1">
                  Target · {formatPKR(target)}
                </p>

                <div className="mt-6">
                  <p className="font-display text-3xl tabular">
                    <span className="text-muted text-lg mr-1">₨</span>
                    {formatPKR(saved, { showSymbol: false })}
                    <span className="text-base text-muted">/{formatPKRCompact(target)}</span>
                  </p>

                  <div className="ff-progress mt-3" style={{ height: 8 }}>
                    <span
                      className="ff-progress__fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                    <span>{pct}% complete</span>
                    {g.deadline && (
                      <span>
                        {days !== null && days > 0
                          ? `${days} days to ${formatDate(g.deadline)}`
                          : "deadline passed"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Remaining ·{" "}
                    <span className="text-ink font-display text-base">
                      {formatPKR(remaining, { showSymbol: false })}
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setContribTo(g)}>
                    <Plus className="h-3.5 w-3.5" />
                    Contribute
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New goal"
        description="Pick a target and a deadline — we'll track how far you've come."
      >
        <GoalForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={editGoal !== null}
        onOpenChange={(open) => !open && setEditGoal(null)}
        title="Edit goal"
        description="Tweak the title, target, deadline, or icon."
      >
        {editGoal && <GoalForm key={editGoal.id} goal={editGoal} onDone={() => setEditGoal(null)} />}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.title ?? "goal"}?`}
        description="This removes the goal and its contribution history. This action can't be undone."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(null)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConfirmDelete}
            loading={remove.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Modal
        open={contribTo !== null}
        onOpenChange={(open) => !open && setContribTo(null)}
        title={`Contribute to ${contribTo?.title ?? ""}`}
        description="Move money toward your goal. We'll log it as a contribution."
      >
        <form onSubmit={handleSubmit(onContribute)} className="space-y-4">
          <Input
            label="Amount (PKR)"
            type="number"
            placeholder="10000"
            error={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />
          <Input
            label="Note (optional)"
            placeholder="Monthly auto-save"
            error={errors.note?.message}
            {...register("note")}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setContribTo(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={contribute.isPending}>
              Add contribution
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};

export default GoalsView;
