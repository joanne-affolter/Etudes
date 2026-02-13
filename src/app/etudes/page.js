'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Popover, Flex, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, HomeOutlined } from "@ant-design/icons";

import { Accueil, EnCours, Archives, DrawerNew } from './components';
import { fetchProjects, createProject, updateStatut } from './data';

import Image from 'next/image';

import { useRouter } from "next/navigation";
const { Header, Content, Sider, Footer } = Layout;


// Placeholders for data 
function getData(label) {
  if (label === 'en-cours') {
    return dataEtudes.filter(item => item.statut === 'en-cours');
  }
  else if (label === 'archives') {
    return dataEtudes.filter(item => item.statut === 'archives');
  }
}

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem('Accueil', 'accueil', <HomeOutlined />),
  getItem('En Cours', 'en-cours', <CheckCircleOutlined />),
  // getItem('Archivés', 'archives', <CloseCircleOutlined />),
];


export default function DashboardLayout({ children }) {
  const [selected, setSelected] = useState('accueil');
  const [dataEnCours, setDataEnCours] = useState([]);
  const [dataArchives, setDataArchives] = useState([]);

  const router = useRouter();

  const renderScreen = () => {
    switch (selected) {
      case 'en-cours': return <EnCours data={dataEnCours} onAction={onAction} />;
      //case 'archives': return <Archives data={dataArchives} onAction={onAction} />;
      default: return <Accueil />;
    }
  };

  // ________________________________________________________
  // FETCH DATA 
  // _________________________________________________________
  useEffect(() => {
    //createProject({ reference: 'Proj-002', adresse: '123 Main St, GhostVille', statut: 'archives' });
    fetchProjects().then(projects => {
      setDataEnCours(projects.filter(project => project.statut === 'en-cours'));
      //setDataArchives(projects.filter(project => project.statut === 'archives'));
    });
  }, []);

  // ________________________________________________________
  // Handle Archive / Restore / Edit
  const onAction = React.useCallback(async (record, action) => {
    try {
      const id = record.id ?? record.key; // whichever you have
      const next = action; // === "archive" ? "archives" : "en-cours";

      // optimistic update
      if (next === "archives") {
        // SUPPRIMER complètement le projet et toutes ses données
        setDataEnCours(prev => prev.filter(p => (p.id ?? p.key) !== id));

        // Appeler la route DELETE pour supprimer le projet et tous ses blobs
        const response = await fetch(`/api/etudes/${id}/delete`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete project');
        }

        const result = await response.json();
        console.log('[delete-project] Success:', result);

      } else if (next === "en-cours") {
        //setDataArchives(prev => prev.filter(p => (p.id ?? p.key) !== id));
        setDataEnCours(prev => [{ ...record, statut: "en-cours" }, ...prev]);
        await updateStatut(id, next); // backend call
      } else if (next === "modifier") {
        // Handle edit action if needed
        console.log("Edit action for:", record);
        router.push(`/etudes/${id}`); // Navigate to edit page
      }


    } catch (e) {
      console.error("Action failed:", e);
      // TODO: revert optimistic state if needed
    }
  }, [router]);

  const onSaveNew = React.useCallback(async (data) => {
    try {
      console.log("Saving new project:", data);
      const newProject = await createProject(data);
      if (newProject) {
        setDataEnCours(prev => [newProject, ...prev]);
        setSelected('en-cours'); // switch to 'En Cours' view
      }
    } catch (e) {
      console.error("Failed to create project:", e);
    }
  }, []);



  return (
    <Layout
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column', // header (top) -> main (grow) -> footer (bottom)
      }}
    >
      {/* Header (independent) */}
      <Header style={{ padding: '0 24px', backgroundColor: 'var(--color-primary)' }} >
        <Flex justify="space-between" align="center">
          <Image src="/logo.png" alt="Logo" width={50} height={50}
            style={{
              padding: 0,
              margin: 0,
            }}
          />
          <h1 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Etude ENEDIS</h1>

          <DrawerNew onAction={onSaveNew} />

        </Flex>

      </Header>

      {/* Main zone grows to fill space */}
      <Layout style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--color-background)' }}>

        <Sider
          breakpoint="lg"
          collapsedWidth="0"
        >

          <Menu selectedKeys={[selected]} onClick={({ key }) => setSelected(key)} mode="inline" items={items} style={{ padding: '30px 0', height: '100%' }} />


        </Sider>

        {/* Right column */}
        <Layout>

          <Content className="m-0 overflow-auto h-full">
            <div className="bg-white m-12 rounded-lg relative ">

              {renderScreen()}
            </div>
          </Content>
          {/* Footer (independent, always at bottom) */}
          <Footer style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)' }}>
            Reve Apps ©{new Date().getFullYear()} Created by J. Affolter
          </Footer>
        </Layout>
      </Layout>


    </Layout>
  );
}
