"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AuthCard } from "@/app/components/auth-card";

/**
 * Модальная точка подключения: тот же AuthCard, только закрытие диалога —
 * её собственное решение об успехе.
 */
export function AuthModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline" />}>
        Вход в модалке
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Вход</DialogTitle>
          <DialogDescription>
            Тот же компонент формы, что и на странице.
          </DialogDescription>
        </DialogHeader>
        <AuthCard instance="auth:modal" onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}