"use client";

import React from "react";
import { TipTapEditor } from "./TipTapEditor";

export interface RichTextEditorInnerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function RichTextEditorInner({
  value,
  onChange,
  placeholder,
  readOnly = false,
  className,
}: RichTextEditorInnerProps) {
  return (
    <TipTapEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={className}
    />
  );
}
