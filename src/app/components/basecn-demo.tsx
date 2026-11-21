"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthCard } from "@/app/components/auth-card";

export function BasecnDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        RedwoodSDK + basecn
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Base UI primitives</CardTitle>
          <CardDescription>
            Компоненты из реестра basecn, собранные на Base UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-name">Имя</Label>
            <Input
              id="demo-name"
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Как вас зовут?"
              value={name}
            />
          </div>

          <div className="flex gap-2">
            <Dialog onOpenChange={setOpen} open={open}>
              <DialogTrigger render={<Button variant="outline" />}>
                Открыть диалог
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Привет{name ? `, ${name}` : ""}</DialogTitle>
                  <DialogDescription>
                    Это basecn Dialog на Base UI, без Radix.
                  </DialogDescription>
                </DialogHeader>
                <AuthCard />
                <DialogFooter>
                  <Button onClick={() => setOpen(false)}>Закрыть</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button>Действие</Button>
            <Button variant="destructive">Удалить</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
