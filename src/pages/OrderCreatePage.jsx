import { useEffect, useMemo, useState } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Input, Button, Table, InputNumber, Tag, Space,
  Alert, Divider, Typography, App, Modal, Descriptions, AutoComplete, Empty,
} from 'antd';
import { DeleteOutlined, PlusOutlined, FilePdfOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  searchCustomers, fetchCustomer, searchProducts, fetchUsers, fetchCompany,
  createOrder, orderPdfUrl, emailOrder,
} from '../api/endpoints.js';
import { calcFoc, computeLine, computeTotals } from '../utils/calc.js';
import { money, num, fmtDate } from '../utils/format.js';

const { Text } = Typography;

export default function OrderCreatePage() {
  const { message } = App.useApp();

  const [company, setCompany] = useState({ vatPercent: 5, currency: 'OMR' });
  const [salesPersons, setSalesPersons] = useState([]);

  // Header
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [salesPerson, setSalesPerson] = useState(null);
  const [orderDate, setOrderDate] = useState(dayjs());
  const [deliveryDate, setDeliveryDate] = useState(dayjs().add(2, 'day'));
  const [remarks, setRemarks] = useState('');

  // Items
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [items, setItems] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    fetchCompany().then((r) => setCompany(r.data)).catch(() => {});
    fetchUsers('sales_person').then((r) => setSalesPersons(r.data)).catch(() => {});
  }, []);

  const vatPercent = company.vatPercent ?? 5;

  // ---- Customer search ----
  const onCustomerSearch = async (val) => {
    if (!val) return;
    try {
      const res = await searchCustomers(val);
      setCustomerOptions(
        res.data.map((c) => ({
          value: c._id,
          label: `${c.customerName} (${c.customerCode})${c.status !== 'active' ? ' — INACTIVE' : ''}`,
        }))
      );
    } catch (e) {
      message.error(e.message);
    }
  };
  const onCustomerSelect = async (id) => {
    try {
      const res = await fetchCustomer(id);
      setCustomer(res.data);
    } catch (e) {
      message.error(e.message);
    }
  };

  // ---- Product autocomplete ----
  const onProductSearch = async (val) => {
    setProductSearch(val);
    if (!val) {
      setProductOptions([]);
      return;
    }
    try {
      const res = await searchProducts(val);
      setProductOptions(
        res.data.map((p) => ({
          value: p._id,
          label: `${p.productName} · ${p.brand} · ${money(p.sellingPrice)} · stock ${p.stockQuantity}${
            p.status !== 'active' ? ' · INACTIVE' : ''
          }`,
          product: p,
        }))
      );
    } catch (e) {
      message.error(e.message);
    }
  };
  const onProductPick = (_, option) => {
    const p = option.product;
    setProductSearch('');
    setProductOptions([]);
    if (items.some((it) => it.product === p._id)) {
      message.info('Product already added — adjust the quantity instead.');
      return;
    }
    const quantity = 1;
    setItems((prev) => [
      ...prev,
      {
        key: p._id,
        product: p._id,
        productCode: p.productCode,
        productName: p.productName,
        brand: p.brand,
        stockQuantity: p.stockQuantity,
        status: p.status,
        focBuyQuantity: p.focBuyQuantity,
        focFreeQuantity: p.focFreeQuantity,
        quantity,
        rate: p.sellingPrice,
        discountPercentage: p.discountPercentage,
        focQuantity: calcFoc(quantity, p.focBuyQuantity, p.focFreeQuantity),
      },
    ]);
  };

  const updateItem = (key, patch) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const next = { ...it, ...patch };
        // Recompute FOC from scheme when quantity changes (unless FOC manually edited).
        if (patch.quantity != null && patch.focQuantity == null) {
          next.focQuantity = calcFoc(next.quantity, it.focBuyQuantity, it.focFreeQuantity);
        }
        return next;
      })
    );
  };

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it.key !== key));

  const totals = useMemo(() => computeTotals(items, vatPercent), [items, vatPercent]);

  // ---- Validation hints (mirror server) ----
  const warnings = useMemo(() => {
    const w = [];
    if (customer && customer.status !== 'active') w.push('Selected customer is INACTIVE — order will be rejected.');
    items.forEach((it) => {
      if (it.status !== 'active') w.push(`${it.productName} is inactive.`);
      if (it.quantity + it.focQuantity > it.stockQuantity)
        w.push(`${it.productName}: requested ${it.quantity}+${it.focQuantity} FOC exceeds stock ${it.stockQuantity}.`);
    });
    if (customer && totals.grandTotal > customer.availableCredit)
      w.push(
        `Order total ${money(totals.grandTotal)} exceeds available credit ${money(customer.availableCredit)}.`
      );
    return w;
  }, [customer, items, totals]);

  const canSubmit = customer && customer.status === 'active' && deliveryDate && items.length > 0;

  const submit = async (status = 'submitted') => {
    if (!customer) return message.error('Select a customer');
    if (status === 'submitted' && !deliveryDate) return message.error('Delivery date is required');
    if (!items.length) return message.error('Add at least one product');

    setSubmitting(true);
    try {
      const payload = {
        customer: customer._id,
        salesPerson: salesPerson || undefined,
        orderDate: orderDate?.toISOString(),
        deliveryDate: deliveryDate?.toISOString(),
        remarks,
        status,
        items: items.map((it) => ({
          product: it.product,
          quantity: it.quantity,
          rate: it.rate,
          discountPercentage: it.discountPercentage,
          focQuantity: it.focQuantity,
        })),
      };
      const res = await createOrder(payload);
      setCreated(res.data);
      message.success(`Order ${res.data.orderNumber} created`);
      // Reset form items but keep customer for convenience.
      setItems([]);
      setRemarks('');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      render: (_, r) => (
        <div>
          <div>{r.productName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.brand} · {r.productCode}</Text>
        </div>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      width: 80,
      render: (q) => <Tag color={q <= 0 ? 'red' : q < 50 ? 'orange' : 'green'}>{q}</Tag>,
    },
    {
      title: 'Qty',
      width: 90,
      render: (_, r) => (
        <InputNumber min={1} value={r.quantity} onChange={(v) => updateItem(r.key, { quantity: v || 1 })} style={{ width: '100%' }} />
      ),
    },
    {
      title: 'Rate',
      width: 110,
      render: (_, r) => (
        <InputNumber min={0} step={0.001} value={r.rate} onChange={(v) => updateItem(r.key, { rate: v || 0 })} style={{ width: '100%' }} />
      ),
    },
    {
      title: 'Disc %',
      width: 90,
      render: (_, r) => (
        <InputNumber min={0} max={100} value={r.discountPercentage} onChange={(v) => updateItem(r.key, { discountPercentage: v || 0 })} style={{ width: '100%' }} />
      ),
    },
    {
      title: 'FOC',
      width: 90,
      render: (_, r) => (
        <InputNumber min={0} value={r.focQuantity} onChange={(v) => updateItem(r.key, { focQuantity: v || 0 })} style={{ width: '100%' }} />
      ),
    },
    {
      title: 'Total',
      width: 110,
      align: 'right',
      render: (_, r) => money(computeLine(r).lineTotal),
    },
    {
      title: '',
      width: 50,
      render: (_, r) => <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(r.key)} />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Order Header" size="small">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <label>Customer *</label>
            <Select
              showSearch
              placeholder="Search customer by name or code"
              style={{ width: '100%' }}
              filterOption={false}
              onSearch={onCustomerSearch}
              onSelect={onCustomerSelect}
              options={customerOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <label>Sales Person</label>
            <Select
              allowClear
              placeholder="Select sales person"
              style={{ width: '100%' }}
              value={salesPerson}
              onChange={setSalesPerson}
              options={salesPersons.map((u) => ({ value: u._id, label: u.name }))}
            />
          </Col>
          <Col xs={12} md={5}>
            <label>Order Date</label>
            <DatePicker style={{ width: '100%' }} value={orderDate} onChange={setOrderDate} />
          </Col>
          <Col xs={12} md={5}>
            <label>Delivery Date *</label>
            <DatePicker style={{ width: '100%' }} value={deliveryDate} onChange={setDeliveryDate} />
          </Col>
        </Row>
        <Row style={{ marginTop: 12 }}>
          <Col span={24}>
            <label>Remarks</label>
            <Input.TextArea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
          </Col>
        </Row>

        {customer && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
              <Descriptions.Item label="Customer">{customer.customerName}</Descriptions.Item>
              <Descriptions.Item label="Credit Limit">{money(customer.creditLimit)}</Descriptions.Item>
              <Descriptions.Item label="Outstanding">{money(customer.outstandingAmount)}</Descriptions.Item>
              <Descriptions.Item label="Available">
                <Text type={customer.availableCredit > 0 ? 'success' : 'danger'}>
                  {money(customer.availableCredit)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card
        title="Order Items"
        size="small"
        extra={
          <AutoComplete
            style={{ width: 'min(380px, 56vw)' }}
            value={productSearch}
            options={productOptions}
            onSearch={onProductSearch}
            onSelect={onProductPick}
            placeholder="Search product to add..."
            notFoundContent={productSearch ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
          >
            <Input prefix={<PlusOutlined />} />
          </AutoComplete>
        }
      >
        <Table
          rowKey="key"
          size="small"
          columns={columns}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: 'Search and add products above' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Please review"
          description={<ul style={{ margin: 0, paddingLeft: 18 }}>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} md={14} />
        <Col xs={24} md={10}>
          <Card size="small" title="Order Summary">
            <table className="totals-table" style={{ width: '100%' }}>
              <tbody>
                <tr><td className="label">Subtotal</td><td className="value">{money(totals.subtotal)}</td></tr>
                <tr><td className="label">Discount</td><td className="value">- {money(totals.totalDiscount)}</td></tr>
                <tr><td className="label">Total FOC (free units)</td><td className="value">{totals.totalFoc}</td></tr>
                <tr><td className="label">Net Amount</td><td className="value">{money(totals.netAmount)}</td></tr>
                <tr><td className="label">VAT ({vatPercent}%)</td><td className="value">{money(totals.vatAmount)}</td></tr>
                <tr>
                  <td className="label"><strong>Grand Total</strong></td>
                  <td className="value"><strong>{money(totals.grandTotal)}</strong></td>
                </tr>
              </tbody>
            </table>
            <Divider style={{ margin: '12px 0' }} />
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => submit('draft')} loading={submitting} disabled={!customer || !items.length}>
                Save Draft
              </Button>
              <Button type="primary" onClick={() => submit('submitted')} loading={submitting} disabled={!canSubmit}>
                Submit Order
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <SuccessModal company={company} created={created} onClose={() => setCreated(null)} />
    </Space>
  );
}

function SuccessModal({ created, onClose, company }) {
  const { message } = App.useApp();
  const [emailing, setEmailing] = useState(false);
  if (!created) return null;

  const sendEmail = async () => {
    setEmailing(true);
    try {
      const r = await emailOrder(created._id);
      if (r.sent === false) message.warning(r.message);
      else message.success('Email sent with PDF attachment');
    } catch (e) {
      message.error(e.message);
    } finally {
      setEmailing(false);
    }
  };

  return (
    <Modal
      open={!!created}
      onCancel={onClose}
      width="min(520px, 92vw)"
      title={`Order ${created.orderNumber} created`}
      footer={[
        <Button key="email" icon={<MailOutlined />} loading={emailing} onClick={sendEmail}>
          Send Email
        </Button>,
        <Button key="pdf" type="primary" icon={<FilePdfOutlined />} href={orderPdfUrl(created._id)} target="_blank">
          Download PDF
        </Button>,
        <Button key="close" onClick={onClose}>Close</Button>,
      ]}
    >
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Order Number">{created.orderNumber}</Descriptions.Item>
        <Descriptions.Item label="Booking Number">{created.bookingNumber}</Descriptions.Item>
        <Descriptions.Item label="Customer">{created.customerName}</Descriptions.Item>
        <Descriptions.Item label="Delivery Date">{fmtDate(created.deliveryDate)}</Descriptions.Item>
        <Descriptions.Item label="Items">{created.items?.length}</Descriptions.Item>
        <Descriptions.Item label="Grand Total">{money(created.grandTotal)}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}
