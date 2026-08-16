"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminOrdersApi } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, ChevronRight, Filter } from "lucide-react";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () =>
      adminOrdersApi.getOrders({
        status: statusFilter || undefined,
        pageNumber: 1,
        pageSize: 50,
      }),
  });

  const orders = ordersResponse?.items || [];

  // Filter orders by search term
  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Tüm müşteri siparişlerini inceleyin ve yönetin
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Toplam Sipariş</div>
          <div className="text-2xl font-bold">{ordersResponse?.totalCount || 0}</div>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <div className="text-sm text-gray-600">Beklemede</div>
          <div className="text-2xl font-bold">
            {orders.filter((o) => o.status === "Pending").length}
          </div>
        </Card>
        <Card className="p-4 bg-blue-50">
          <div className="text-sm text-gray-600">Teklif Gönderildi</div>
          <div className="text-2xl font-bold">
            {orders.filter((o) => o.status === "QuoteSent").length}
          </div>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="text-sm text-gray-600">Onaylandı</div>
          <div className="text-2xl font-bold">
            {orders.filter((o) => o.status === "Confirmed").length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Sipariş numarasına göre ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="">Tüm Durumlar</option>
          <option value="Pending">Beklemede</option>
          <option value="QuoteSent">Teklif Gönderildi</option>
          <option value="Confirmed">Onaylandı</option>
          <option value="Preparing">Hazırlanıyor</option>
          <option value="QualityCheck">Kalite Kontrol</option>
          <option value="ReadyToShip">Gönderime Hazır</option>
          <option value="Shipping">Kargoda</option>
          <option value="Delivered">Teslim Edildi</option>
          <option value="Cancelled">İptal Edildi</option>
        </select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter ? "Sipariş bulunamadı" : "Henüz sipariş yok"}
          </h2>
          <p className="text-gray-600">
            {searchTerm || statusFilter
              ? "Aramanızı veya filtreleri değiştirmeyi deneyin"
              : "Müşteriler sipariş verdikçe burada görünecek"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {order.orderNumber}
                      </h3>
                      <OrderStatusBadge status={order.status} />
                      {order.hasUnreadComments && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Yeni
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="block text-xs text-gray-500">
                          Oluşturulma
                        </span>
                        {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                      </div>

                      <div>
                        <span className="block text-xs text-gray-500">
                          Ürün Adedi
                        </span>
                        {order.itemCount}
                      </div>

                      {order.totalAmount && (
                        <div>
                          <span className="block text-xs text-gray-500">
                            Toplam
                          </span>
                          {order.currency} {order.totalAmount.toFixed(2)}
                        </div>
                      )}

                      {order.requestedDeliveryDate && (
                        <div>
                          <span className="block text-xs text-gray-500">
                            İstenen Teslim Tarihi
                          </span>
                          {new Date(
                            order.requestedDeliveryDate
                          ).toLocaleDateString("tr-TR")}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {ordersResponse && ordersResponse.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" disabled>
            Önceki
          </Button>
          <span className="text-sm text-gray-600">
            Sayfa {ordersResponse.pageNumber} / {ordersResponse.totalPages}
          </span>
          <Button variant="outline" disabled>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
