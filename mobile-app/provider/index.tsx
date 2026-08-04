import { StatusBar } from "expo-status-bar";
import StoreProvider from "@/provider/StoreProvider";
import QueryProvider from "@/provider/QueryProvider";

type Props = {
  children: React.ReactNode;
};

const AppProviders = ({ children }: Props) => {
  return (
    <StoreProvider>
      <QueryProvider>
        <StatusBar style="light" />
        {children}
      </QueryProvider>
    </StoreProvider>
  );
};

export default AppProviders;
