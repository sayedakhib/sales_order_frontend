import { useEffect, useState } from 'react';
import {
  Card, Input, Table, Tag, Button, Drawer, Descriptions, Divider, Tabs, App, Space, Empty,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  fetchProducts, fetchSimilar, fetchComparison, fetchVariations,
} from '../api/endpoints.js';
import { money, statusColor } from '../utils/format.js';

function StockTag({ qty }) {
  if (qty <= 0) return <Tag color="red">Out of stock</Tag>;
  if (qty < 50) return <Tag color="orange">{qty}</Tag>;
  return <Tag color="green">{qty}</Tag>;
}

function focLabel(p) {
  return p.focBuyQuantity && p.focFreeQuantity
    ? `Buy ${p.focBuyQuantity} Get ${p.focFreeQuantity}`
    : '-';
}

export default function ProductsPage() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [variations, setVariations] = useState(null);

  const load = async (search = '') => {
    setLoading(true);
    try {
      const res = await fetchProducts({ q: search, limit: 100 });
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

  const openDetail = async (p) => {
    setProduct(p);
    setOpen(true);
    setSimilar(null);
    setComparison(null);
    setVariations(null);
    try {
      const [s, c, v] = await Promise.all([
        fetchSimilar(p._id),
        fetchComparison(p._id),
        fetchVariations(p._id),
      ]);
      setSimilar(s.data);
      setComparison(c.data);
      setVariations(v.data);
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'productCode', width: 100 },
    { title: 'Product', dataIndex: 'productName' },
    { title: 'Generic', dataIndex: 'genericName' },
    { title: 'Brand', dataIndex: 'brand' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Stock', dataIndex: 'stockQuantity', width: 110, render: (q) => <StockTag qty={q} /> },
    { title: 'Price', dataIndex: 'sellingPrice', align: 'right', render: money },
    { title: 'Disc%', dataIndex: 'discountPercentage', align: 'right', width: 70 },
    { title: 'FOC', key: 'foc', render: (_, p) => focLabel(p) },
    {
      title: 'Status', dataIndex: 'status', width: 90,
      render: (s) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: '', key: 'action', width: 90,
      render: (_, p) => <Button size="small" onClick={() => openDetail(p)}>View</Button>,
    },
  ];

  const compareColumns = [
    { title: 'Brand', dataIndex: 'brand', render: (b, r) => (r.isCurrent ? <strong>{b} (current)</strong> : b) },
    { title: 'Product', dataIndex: 'productName' },
    { title: 'Price', dataIndex: 'price', align: 'right', render: money },
    { title: 'Stock', dataIndex: 'availableStock', align: 'right', render: (q) => <StockTag qty={q} /> },
    { title: 'Discount %', dataIndex: 'discount', align: 'right' },
  ];

  return (
    <Card title="Products">
      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Search by name, code, brand or generic..."
        style={{ maxWidth: 460, marginBottom: 16 }}
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
        title={product ? `${product.productName} (${product.productCode})` : 'Product'}
        width="min(620px, 100vw)"
        open={open}
        onClose={() => setOpen(false)}
      >
        {product && (
          <>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Generic">{product.genericName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Brand">{product.brand || '-'}</Descriptions.Item>
              <Descriptions.Item label="Category">{product.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Variation">{product.variation || '-'}</Descriptions.Item>
              <Descriptions.Item label="Price">{money(product.sellingPrice)}</Descriptions.Item>
              <Descriptions.Item label="Discount">{product.discountPercentage}%</Descriptions.Item>
              <Descriptions.Item label="Stock"><StockTag qty={product.stockQuantity} /></Descriptions.Item>
              <Descriptions.Item label="FOC">{focLabel(product)}</Descriptions.Item>
            </Descriptions>

            <Divider />
            <Tabs
              items={[
                {
                  key: 'compare',
                  label: 'Comparison',
                  children: (
                    <Table
                      rowKey="productId"
                      size="small"
                      pagination={false}
                      columns={compareColumns}
                      dataSource={comparison?.comparison || []}
                      scroll={{ x: 'max-content' }}
                    />
                  ),
                },
                {
                  key: 'variations',
                  label: `Variations (${variations?.count ?? 0})`,
                  children: variations?.variations?.length ? (
                    <Space wrap>
                      {variations.variations.map((v) => (
                        <Tag key={v.productId} color="blue" style={{ padding: '4px 8px' }}>
                          {v.variation || v.productName} · {v.brand} · {money(v.price)}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Empty />
                  ),
                },
                {
                  key: 'similar',
                  label: 'Alternatives',
                  children: similar ? (
                    <>
                      {similar.outOfStock && (
                        <Tag color="red" style={{ marginBottom: 8 }}>
                          This product is out of stock — alternatives suggested below
                        </Tag>
                      )}
                      <Divider orientation="left" plain>Same Generic</Divider>
                      <Space wrap>
                        {(similar.sameGeneric || []).map((p) => (
                          <Tag key={p._id} color="green">{p.brand} — {p.productName}</Tag>
                        ))}
                        {!similar.sameGeneric?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                      </Space>
                      <Divider orientation="left" plain>Same Category</Divider>
                      <Space wrap>
                        {(similar.sameCategory || []).map((p) => (
                          <Tag key={p._id}>{p.productName}</Tag>
                        ))}
                        {!similar.sameCategory?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                      </Space>
                    </>
                  ) : null,
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </Card>
  );
}
