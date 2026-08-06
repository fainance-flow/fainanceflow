import FeaturePlaceholderScreen from "@/components/FeaturePlaceholderScreen";

/** Loans are local-only on web (no cloud API yet). */
export default function LoansScreen() {
  return (
    <FeaturePlaceholderScreen
      title="Loans"
      subtitle="Coming next — loan tracking will sync once the cloud API is ready."
    />
  );
}
