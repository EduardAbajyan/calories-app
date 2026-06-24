"use client";

import { useEffect, useState } from "react";

type TimezoneOffsetInputProps = {
  name?: string;
};

export default function TimezoneOffsetInput({
  name = "tzOffsetMin",
}: TimezoneOffsetInputProps) {
  const [offset, setOffset] = useState<string | undefined>(undefined);

  useEffect(() => {
    setOffset(String(new Date().getTimezoneOffset()));
  }, []);

  if (offset === undefined) return null;

  return <input type="hidden" name={name} value={offset} />;
}