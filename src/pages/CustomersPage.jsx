import { useEffect, useState } from 'react';
import {
  Card, Input, Table, Tag, Button, Drawer, Descriptions, Statistic, Row, Col, Divider, List, Typography, App,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchCustomers, fetchCustomer, fetchCustomerHistory } from '../api/endpoints.js';
import { money, fmtDate, statusColor } from '../utils/format.js';

export default function CustomersPage() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState(null);

  const load = async (search = '') => {
    setLoading(true);
    try {
      const res = await fetchCustomers({ q: search, limit: 100 });
      setData(res.data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (id) => {
    setOpen(true);
    setDetail(null);
    setHistory(null);
    try {
      const [c, h] = await Promise.all([fetchCustomer(id), fetchCustomerHistory(id)]);
      setDetail(c.data);
      setHistory(h.data);
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'customerCode', width: 110 },
    { title: 'Name', dataIndex: 'customerName' },
    { title: 'Contact', dataIndex: 'contactPerson' },
    { title: 'Mobile', dataIndex: 'mobileNumber' },
    { title: 'Credit Limit', dataIndex: 'creditLimit', align: 'right', render: money },
    { title: 'Outstanding', dataIndex: 'outstandingAmount', align: 'right', render: money },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (s) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: (_, r) => (
        <Button size="small" onClick={() => openDetail(r._id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Card title="Customers">
      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Search customer by name or code..."
        style={{ maxWidth: 420, marginBottom: 16 }}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          load(e.target.value);
        }}
      />
      <Table
        rowKey="_id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Drawer
        title={detail ? `${detail.customerName} (${detail.customerCode})` : 'Customer'}
        width="min(560px, 100vw)"
        open={open}
        onClose={() => setOpen(false)}
      >
        {detail && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Credit Limit" value={detail.creditLimit} precision={3} suffix="OMR" />
              </Col>
              <Col span={8}>
                <Statistic title="Outstanding" value={detail.outstandingAmount} precision={3} suffix="OMR" valueStyle={{ color: '#cf1322' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Available" value={detail.availableCredit} precision={3} suffix="OMR" valueStyle={{ color: '#3f8600' }} />
              </Col>
            </Row>
            <Divider />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Contact Person">{detail.contactPerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{detail.mobileNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="Email">{detail.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address">
                {[detail.address?.area, detail.address?.city, detail.address?.country]
                  .filter(Boolean)
                  .join(', ') || '-'}
                {detail.address?.zipcode ? ` (${detail.address.zipcode})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Map">
                {detail.address?.googleMapUrl ? (
                  <a href={detail.address.googleMapUrl} target="_blank" rel="noreferrer">
                    Open in Google Maps
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColor[detail.status]}>{detail.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Purchase History</Divider>
            {history && (
              <>
                <Typography.Text type="secondary">
                  {history.orderCount} orders &middot; Total purchased {money(history.totalPurchased)}
                </Typography.Text>
                <List
                  size="small"
                  style={{ marginTop: 8 }}
                  dataSource={history.orders}
                  locale={{ emptyText: 'No orders yet' }}
                  renderItem={(o) => (
                    <List.Item>
                      <List.Item.Meta
                        title={o.orderNumber}
                        description={`Ordered ${fmtDate(o.orderDate)} · Delivery ${fmtDate(o.deliveryDate)}`}
                      />
                      <div>{money(o.grandTotal)}</div>
                    </List.Item>
                  )}
                />
              </>
            )}
          </>
        )}
      </Drawer>
    </Card>
  );
}
