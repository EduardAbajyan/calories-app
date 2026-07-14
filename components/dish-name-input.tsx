"use client";

import { useState } from "react";

type Props = {
  id?: string;
  placeholder?: string;
  className?: string;
};

export default function DishNameInput({
  id = "name",
  placeholder = "",
  className = "",
}: Props) {
  const [value, setValue] = useState("");

  return (
    <input
      id={id}
      name="name"
      type="text"
      required
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={className}
    />
  );
}
