"use client";

import { useAppSelector } from "@hooks/useTypedRedux";

type Props = {
  emphasis?: string;
};

const partOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night";
};

const Greetings = ({ emphasis }: Props) => {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  return (
    <h1 className="font-display text-display-lg font-normal">
      {partOfDay()}, <em className="italic text-gold">{firstName}</em>
      {emphasis && <span className="text-muted"> · {emphasis}</span>}
    </h1>
  );
};

export default Greetings;
