'use client';
import { useParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Flex } from 'antd';
import { InfoCircleOutlined, UserOutlined, TruckOutlined, SettingOutlined, CalculatorOutlined, LoginOutlined, LogoutOutlined} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
const { Header, Content, Sider, Footer } = Layout;
import Image from 'next/image';



// Menu Items
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem('Infos Générales', 'infos-generales', <InfoCircleOutlined />),
  getItem('Contacts', 'contacts', <UserOutlined />),
  getItem('Infos Techniques', 'infos-techniques', <SettingOutlined />),
  getItem('Images Avant', 'images-avant', <LoginOutlined />),
  getItem('Images Après', 'images-apres', <LogoutOutlined />),
  getItem('Matériel', 'materiel', <TruckOutlined />),
  getItem('Préfinancement', 'prefinancement', <CalculatorOutlined />),
];


export default function EtudeLayout({ children }) {
  // Id of the selected Etude from URL
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState('infos-generales');

  useEffect(() => {
    // keep selected in sync if user navigates via back/forward
    const fromPath = pathname?.split('/').pop();
    if (fromPath && fromPath !== selected) setSelected(fromPath);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMenuClick = ({ key }) => {
    if (!id) return; // guard while params load
    setSelected(key);
    router.push(`/etudes/${id}/${key}`);
  };


  return (
    <Layout
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column', 
      }}
    >
      <Header style={{ padding: '0 24px', backgroundColor: 'var(--color-primary)' }} >
      <Flex justify="space-between"  align="center">
          <Image src="/logo.png" alt="Logo" width={50} height={50}             
            style={{
              padding: 0,
              margin: 0, 
            }} 
          />
          <h1 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Etude ENEDIS</h1>
        </Flex>
      
      </Header>

      <Layout style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--color-background)'}}>
          <Sider
            breakpoint="lg"
            collapsedWidth="0"
          >
            <Menu selectedKeys={[selected]} onClick={handleMenuClick} mode="inline" items={items} style={{ padding: '30px 0', height: '100%' }} />
          </Sider>

        <Layout>
          <Content className="m-0 overflow-auto h-full">
            <div className="bg-white m-12 rounded-lg relative ">
              { children }
            </div>
          </Content>
          <Footer style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)' }}>
            Reve Apps ©{new Date().getFullYear()} Created by J. Affolter
          </Footer>
        </Layout>
      </Layout>
      
    </Layout>
  );
}
