import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/index";

type Props = {
  children: React.ReactNode;
};

const StoreProvider = ({ children }: Props) => {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
};

export default StoreProvider;
