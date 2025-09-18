'use client';
import { useParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Flex, Button, message, Spin } from 'antd';
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
  const [messageApi, contextHolder] = message.useMessage();
  const [selected, setSelected] = useState('infos-generales');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
  
      // 1) Fetch project data
      const res = await fetch(`/api/all-data/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch project data`);
      const data = await res.json();
      console.log("Fetched project data for PDF generation:", data);
  
      // 2) Ask server to generate PDF
      const gen = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      if (!gen.ok) {
        const errText = await gen.text().catch(() => '');
        throw new Error(`PDF generation failed (${gen.status}): ${errText}`);
      }
  
      const json = await gen.json();
      const pdfUrl = json?.file || json?.url || json?.download_url;
      if (!pdfUrl) throw new Error('No file URL returned by /api/generate');
  
      const filename = `etude_enedis_${id}.pdf`;
  
      // 3) Open in a new window/tab
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  
      messageApi.success('Le PDF a été généré, ouvert et téléchargé automatiquement.');
    } catch (error) {
      console.error(error);
      messageApi.error(`Erreur lors de la génération du PDF : ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
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
          
          {contextHolder}
          <Button
            type="primary"
            onClick={generatePDF}
            loading={isGenerating}          // <- shows spinner on the button
            disabled={isGenerating}         // <- optional, blocks double click
            style={{ backgroundColor: 'var(--color-secondary)', border: 'none', color: 'var(--color-black)' }}
          >
            Générer PDF
          </Button>
        
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
            {isGenerating && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "rgba(255,255,255,0.6)", // semi-transparent
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2000,
                }}
              >
                <Spin tip="Génération du PDF..." size="large" />
              </div>
            )}
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
