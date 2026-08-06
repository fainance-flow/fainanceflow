import FeaturePlaceholderScreen from "@/components/FeaturePlaceholderScreen";

/** Subscriptions are local-only on web (no cloud API yet). */
export default function SubscriptionsScreen() {
  return (
    <FeaturePlaceholderScreen
      title="Subscriptions"
      subtitle="Coming next — recurring bills will sync once the cloud API is ready."
    />
  );
}
