"use client";

import { useEffect, useState } from "react";

type TimezoneOffsetInputProps = {
  name?: string;
};

export default function TimezoneOffsetInput({
  name = "tzOffsetMin",
}: TimezoneOffsetInputProps) {
  const [offset, setOffset] = useState("0");

  useEffect(() => {
    setOffset(String(new Date().getTimezoneOffset()));
  }, []);

  return <input type="hidden" name={name} value={offset} />;
}