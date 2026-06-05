import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Input, DatePicker, Select, Row, Col, Button, Drawer, Descriptions, App, Space, Dropdown,
} from 'antd';
import { SearchOutlined, FilePdfOutlined, MailOutlined, DownOutlined } from '@ant-design/icons';
import {
  fetchOrders, fetchOrder, fetchCustomers, orderPdfUrl, emailOrder, updateOrderStatus,
} from '../api/endpoints.js';
import { money, fmtDate, statusColor } from '../utils/format.js';

const { RangePicker } = DatePicker;

// Allowed status transitions (mirrors the backend workflow).
const ORDER_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export default function OrdersPage() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  const [filters, setFilters] = useState({ q: '', customer: undefined, status: undefined, range: null });

  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [emailing, setEmailing] = useState(false);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const params = { q: f.q || undefined, customer: f.customer, status: f.status, limit: 200 };
      if (f.range?.length === 2) {
        params.dateFrom = f.range[0].format('YYYY-MM-DD');
        params.dateTo = f.range[1].format('YYYY-MM-DD');
      }
      const res = await fetchOrders(params);
      setData(res.data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchCustomers({ limit: 100 }).then((r) => setCustomers(r.data)).catch(() => {});
  }, []);

  const setF = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  };

  const openOrder = async (id) => {
    setOpen(true);
    setOrder(null);
    try {
      const res = await fetchOrder(id);
      setOrder(res.data);
    } catch (e) {
      message.error(e.message);
    }
  };

  const sendEmail = async (id) => {
    setEmailing(true);
    try {
      const r = await emailOrder(id);
      if (r.sent === false) message.warning(r.message);
      else message.success('Email sent with PDF attachment');
    } catch (e) {
      message.error(e.message);
    } finally {
      setEmailing(false);
    }
  };

  // Advance an order through the status workflow.
  const changeStatus = async (id, next) => {
    try {
      const r = await updateOrderStatus(id, next);
      message.success(r.message);
      load();
      if (order && order._id === id) setOrder(r.data);
    } catch (e) {
      message.error(e.message);
    }
  };

  // Build a status <Dropdown> showing the allowed next statuses (or a plain tag if terminal).
  const StatusControl = ({ id, status }) => {
    const nexts = ORDER_TRANSITIONS[status] || [];
    const tag = <Tag color={statusColor[status]} style={{ marginInlineEnd: 0 }}>{status}</Tag>;
    if (!nexts.length) return tag;
    return (
      <Dropdown
        trigger={['click']}
        menu={{
          items: nexts.map((s) => ({ key: s, label: `Mark as ${s}` })),
          onClick: ({ key }) => changeStatus(id, key),
        }}
      >
        <a onClick={(e) => e.preventDefault()} style={{ whiteSpace: 'nowrap' }}>
          {tag} <DownOutlined style={{ fontSize: 10 }} />
        </a>
      </Dropdown>
    );
  };

  const columns = [
    { title: 'Order #', dataIndex: 'orderNumber', width: 140 },
    { title: 'Customer', dataIndex: 'customerName' },
    { title: 'Order Date', dataIndex: 'orderDate', render: fmtDate },
    { title: 'Delivery Date', dataIndex: 'deliveryDate', render: fmtDate },
    { title: 'Total', dataIndex: 'totalAmount', align: 'right', render: money },
    {
      title: 'Status', dataIndex: 'status', width: 130,
      render: (s, r) => <StatusControl id={r.id} status={s} />,
    },
    {
      title: '', key: 'a', width: 170,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openOrder(r.id)}>View</Button>
          <Button size="small" icon={<FilePdfOutlined />} href={orderPdfUrl(r.id)} target="_blank" />
        </Space>
      ),
    },
  ];

  const itemColumns = [
    { title: 'Product', dataIndex: 'productName' },
    { title: 'Qty', dataIndex: 'quantity', align: 'right', width: 60 },
    { title: 'FOC', dataIndex: 'focQuantity', align: 'right', width: 60 },
    { title: 'Rate', dataIndex: 'rate', align: 'right', render: money },
    { title: 'Disc%', dataIndex: 'discountPercentage', align: 'right', width: 70 },
    { title: 'Total', dataIndex: 'lineTotal', align: 'right', render: money },
  ];

  return (
    <Card title="Order Listing">
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} md={7}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search order # or customer"
            onChange={(e) => setF({ q: e.target.value })}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            allowClear
            placeholder="Filter by customer"
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="label"
            onChange={(v) => setF({ customer: v })}
            options={customers.map((c) => ({ value: c._id, label: `${c.customerName} (${c.customerCode})` }))}
          />
        </Col>
        <Col xs={12} md={5}>
          <Select
            allowClear
            placeholder="Status"
            style={{ width: '100%' }}
            onChange={(v) => setF({ status: v })}
            options={['draft', 'submitted', 'confirmed', 'delivered', 'cancelled'].map((s) => ({ value: s, label: s }))}
          />
        </Col>
        <Col xs={12} md={6}>
          <RangePicker style={{ width: '100%' }} onChange={(v) => setF({ range: v })} />
        </Col>
      </Row>

      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Drawer
        title={order ? `Order ${order.orderNumber}` : 'Order'}
        width="min(720px, 100vw)"
        open={open}
        onClose={() => setOpen(false)}
        extra={
          order && (
            <Space>
              <Button icon={<MailOutlined />} loading={emailing} onClick={() => sendEmail(order._id)}>Email</Button>
              <Button type="primary" icon={<FilePdfOutlined />} href={orderPdfUrl(order._id)} target="_blank">PDF</Button>
            </Space>
          )
        }
      >
        {order && (
          <>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="Booking #">{order.bookingNumber}</Descriptions.Item>
              <Descriptions.Item label="Status"><StatusControl id={order._id} status={order.status} /></Descriptions.Item>
              <Descriptions.Item label="Customer">{order.customerName}</Descriptions.Item>
              <Descriptions.Item label="Sales Person">{order.salesPersonName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{fmtDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Delivery Date">{fmtDate(order.deliveryDate)}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span={2}>{order.remarks || '-'}</Descriptions.Item>
            </Descriptions>

            <Table
              rowKey={(r, i) => i}
              size="small"
              style={{ marginTop: 16 }}
              columns={itemColumns}
              dataSource={order.items}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />

            <table className="totals-table" style={{ width: 320, marginTop: 16, marginLeft: 'auto' }}>
              <tbody>
                <tr><td className="label">Subtotal</td><td className="value">{money(order.subtotal)}</td></tr>
                <tr><td className="label">Discount</td><td className="value">- {money(order.totalDiscount)}</td></tr>
                <tr><td className="label">Total FOC</td><td className="value">{order.totalFoc}</td></tr>
                <tr><td className="label">Net</td><td className="value">{money(order.netAmount)}</td></tr>
                <tr><td className="label">VAT ({order.vatPercent}%)</td><td className="value">{money(order.vatAmount)}</td></tr>
                <tr><td className="label"><strong>Grand Total</strong></td><td className="value"><strong>{money(order.grandTotal)}</strong></td></tr>
              </tbody>
            </table>
          </>
        )}
      </Drawer>
    </Card>
  );
}
