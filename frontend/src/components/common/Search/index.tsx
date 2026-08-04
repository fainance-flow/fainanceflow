"use client";

import { Search as SearchIcon } from "lucide-react";
import Input from "@components/common/Input";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

const Search = ({ value, onChange, placeholder = "Search…", className }: Props) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      leading={<SearchIcon className="h-3.5 w-3.5" />}
      className={className}
    />
  );
};

export default Search;
