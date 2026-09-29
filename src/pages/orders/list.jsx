import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from 'api/client';
import useRealtime from 'hooks/useRealtime';
import { AdminOrders as StitchAdminOrders } from '../../views/admin/AdminOrders';
import { AdminOrderDetail as StitchAdminOrderDetail } from '../../views/admin/AdminOrderDetail';

export default function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/orders/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mappedOrders = res.data.map((o) => ({
          id: String(o.id),
          orderNumber: o.order_number || `ORD-${o.id}`,
          date: new Date(o.created_at || Date.now()).toISOString().split('T')[0],
          dealerName: o.dealer_name || 'Agri Store',
          dealerCode: `DLR-${o.dealer || '01'}`,
          dealerCity: 'Palanpur',
          distributorName: o.created_by_name || 'CCS Depot',
          status: o.status || 'Pending Approval',
          paymentStatus: 'Pending',
          subtotal: parseFloat(o.subtotal || o.total_amount || 0),
          discount: 0,
          tax: Math.round(parseFloat(o.total_amount || 0) * 0.18),
          grandTotal: parseFloat(o.total_amount || 0),
          items: (o.items || []).map((i) => ({
            id: String(i.id || Math.random()),
            productId: String(i.product),
            productName: i.product_name || 'Crop Product',
            productCode: 'PRD-01',
            packSize: '1 Ltr',
            quantity: i.quantity || 1,
            dealerPrice: parseFloat(i.rate || 0),
            mrp: parseFloat(i.rate || 0) * 1.2,
            subtotal: parseFloat(i.total || 0),
          })),
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching real orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time listener: auto-update order list when orders change
  useRealtime(
    ['order.created', 'order.updated', 'order.approved', 'order.bilty_created', 'order.lr_created', 'order.dispatched'],
    () => {
      fetchOrders();
    }
  );

  const handleCreateOrder = () => {
    navigate('/field/orders/create');
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/orders/${orderId}/update_status/`, { status: newStatus }).catch((err) => {
        console.warn('API update endpoint fallback:', err);
      });

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 font-body text-xs text-[#525252]">
        Loading Sales Orders Management...
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <StitchAdminOrderDetail
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    );
  }

  return (
    <StitchAdminOrders
      orders={orders}
      onSelectOrder={(ord) => setSelectedOrder(ord)}
      onCreateOrder={handleCreateOrder}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}


