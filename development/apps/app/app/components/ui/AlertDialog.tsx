"use client";

import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

/**
 * AlertDialog — диалог подтверждения поверх Modal (удаление слайда/инсайта/
 * дата-сета, выход с несохранёнными правками). destructive → красная кнопка.
 */
export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function AlertDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = "Подтвердить", cancelLabel = "Отмена", destructive,
}: AlertDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description}
    </Modal>
  );
}
