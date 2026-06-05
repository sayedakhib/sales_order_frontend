import { useState } from 'react';
import { Layout, Menu, Typography, Grid, Button, Drawer } from 'antd';
import {
  ShoppingCartOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import CustomersPage from './pages/CustomersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import OrderCreatePage from './pages/OrderCreatePage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const items = [
  { key: '/orders/new', icon: <PlusCircleOutlined />, label: <Link to="/orders/new">Create Order</Link> },
  { key: '/orders', icon: <UnorderedListOutlined />, label: <Link to="/orders">Order Listing</Link> },
  { key: '/customers', icon: <TeamOutlined />, label: <Link to="/customers">Customers</Link> },
  { key: '/products', icon: <MedicineBoxOutlined />, label: <Link to="/products">Products</Link> },
];

function Logo() {
  return (
    <div style={{ color: '#fff', padding: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <ShoppingCartOutlined style={{ fontSize: 20 }} />
      <Typography.Text strong style={{ color: '#fff' }}>
        Sales Orders
      </Typography.Text>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg; // collapse nav below the lg breakpoint
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Highlight the best-matching top-level menu key.
  const selected =
    items
      .map((i) => i.key)
      .filter((k) => location.pathname === k || location.pathname.startsWith(k + '/'))
      .sort((a, b) => b.length - a.length)[0] || '/orders/new';

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selected]}
      items={items}
      onClick={() => setMobileNavOpen(false)}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider theme="dark" width={220}>
          <Logo />
          {menu}
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            background: '#fff',
            paddingInline: isMobile ? 12 : 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            />
          )}
          <Typography.Title
            level={isMobile ? 5 : 4}
            style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {isMobile ? 'Sales Orders' : 'Sales Order Management Module'}
          </Typography.Title>
        </Header>

        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/orders/new" replace />} />
            <Route path="/orders/new" element={<OrderCreatePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="*" element={<Navigate to="/orders/new" replace />} />
          </Routes>
        </Content>
      </Layout>

      {/* Mobile slide-out navigation */}
      <Drawer
        placement="left"
        open={isMobile && mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width={240}
        styles={{ body: { padding: 0, background: '#001529' }, header: { display: 'none' } }}
      >
        <Logo />
        {menu}
      </Drawer>
    </Layout>
  );
}
