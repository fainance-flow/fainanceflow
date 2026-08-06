import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { contributeToGoal, createGoal, fetchGoals } from "@/services/goals";
import { parseMoney } from "@/utils/currency";
import { formatPKR } from "@/utils/currency";
import type { Goal } from "@/utils/types";
import { colors, radii, spacing, typography } from "@/constants/theme";

type CreateForm = { title: string; targetAmount: string };
type ContributeForm = { amount: string };

export default function GoalsScreen() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["goals"], queryFn: fetchGoals });

  const createForm = useForm<CreateForm>({ defaultValues: { title: "", targetAmount: "" } });
  const contributeForm = useForm<ContributeForm>({ defaultValues: { amount: "" } });

  const createMut = useMutation({
    mutationFn: (v: CreateForm) =>
      createGoal({ title: v.title.trim(), targetAmount: Number(v.targetAmount) }),
    onSuccess: async () => {
      setCreateOpen(false);
      createForm.reset();
      await qc.invalidateQueries({ queryKey: ["goals"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const contributeMut = useMutation({
    mutationFn: (v: ContributeForm) =>
      contributeToGoal(contributeId!, { amount: Number(v.amount) }),
    onSuccess: async () => {
      setContributeId(null);
      contributeForm.reset();
      await qc.invalidateQueries({ queryKey: ["goals"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const pct = (g: Goal) => {
    const t = parseMoney(g.targetAmount);
    const s = parseMoney(g.savedAmount);
    return t > 0 ? Math.min(Math.round((s / t) * 100), 100) : 0;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Button size="md" onPress={() => setCreateOpen(true)}>
          Add
        </Button>
      </View>

      {query.isError ? <Banner variant="error">Couldn&apos;t load goals.</Banner> : null}

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No savings goals yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.meta}>
                {formatPKR(item.savedAmount)} / {formatPKR(item.targetAmount)}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct(item)}%` }]} />
              </View>
              <Button size="md" variant="outline" onPress={() => setContributeId(item.id)}>
                Contribute
              </Button>
            </View>
          )}
        />
      )}

      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New goal</Text>
            <Controller
              control={createForm.control}
              name="title"
              rules={{ required: "Title required" }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Title"
                  placeholder="Emergency fund"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={createForm.control}
              name="targetAmount"
              rules={{ required: "Target required" }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Target"
                  placeholder="100000"
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {createMut.isError ? <Banner variant="error">Couldn&apos;t create goal.</Banner> : null}
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="md"
                loading={createMut.isPending}
                onPress={createForm.handleSubmit((v) => createMut.mutate(v))}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!contributeId} animationType="slide" transparent onRequestClose={() => setContributeId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contribute</Text>
            <Controller
              control={contributeForm.control}
              name="amount"
              rules={{ required: "Amount required" }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Amount"
                  placeholder="5000"
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {contributeMut.isError ? <Banner variant="error">Couldn&apos;t contribute.</Banner> : null}
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setContributeId(null)}>
                Cancel
              </Button>
              <Button
                size="md"
                loading={contributeMut.isPending}
                onPress={contributeForm.handleSubmit((v) => contributeMut.mutate(v))}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: typography.family.sansBold, fontSize: typography.size.xxl, color: colors.ink },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  head: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontFamily: typography.family.sansSemiBold, color: colors.ink, fontSize: typography.size.base },
  status: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.primary,
    textTransform: "uppercase",
  },
  meta: { fontFamily: typography.family.sans, color: colors.muted, fontSize: typography.size.sm },
  track: { height: 6, backgroundColor: colors.surface2, borderRadius: radii.pill, overflow: "hidden" },
  fill: { height: 6, borderRadius: radii.pill, backgroundColor: colors.primary },
  empty: { textAlign: "center", color: colors.faint, marginTop: spacing.xl },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: { fontFamily: typography.family.sansBold, fontSize: typography.size.xl, color: colors.ink },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
