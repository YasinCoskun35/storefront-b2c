"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type CreateUserDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM: CreateUserDto = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  roles: ["Admin"],
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateUserDto>(EMPTY_FORM);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersApi.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.createUser(data),
    onSuccess: () => {
      toast.success("Kullanıcı oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Kullanıcı oluşturulamadı");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.setStatus(id, isActive),
    onSuccess: () => {
      toast.success("Kullanıcı durumu güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Durum güncellenemedi");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcılar</h1>
          <p className="text-muted-foreground">Yönetici kullanıcıları yönetin</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Kullanıcı Ekle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Ad</th>
                <th className="px-4 py-3 text-left text-sm font-medium">E-posta</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Roller</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Henüz kullanıcı yok.
                  </td>
                </tr>
              )}
              {users?.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 rounded text-xs bg-primary/10 text-primary mr-1"
                      >
                        {role}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({ id: user.id, isActive: !user.isActive })
                      }
                    >
                      {user.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı</DialogTitle>
              <DialogDescription>
                Yönetim paneline erişebilecek yeni bir yönetici oluşturun.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  En az 8 karakter; büyük/küçük harf, rakam ve sembol içermelidir.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
