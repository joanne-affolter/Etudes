import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme } from 'antd';
import { Quicksand } from "next/font/google"; // 👈 import font
import './globals.css';

import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr'); // noms de mois/jours en français


// Load font
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // pick the weights you need
});

const config = {
  token: {
    colorPrimary: '#9c5f9c', // Custom primary color
    colorSecondary: '#f0e2f1', // Custom secondary color,
    // Text fonts 
    fontFamily: 'Quicksand, sans-serif',
  },

  components: {
    Layout: {
      triggerBg: 'var(--color-primary)', // Custom trigger background color
    },
    Menu: {
      itemBg: 'var(--color-grey-light)', // Custom menu item text color
      itemSelectedColor: 'var(--color-primary)', // Custom menu item active background color
      itemSelectedBg: 'var(--color-secondary)', // Custom menu item active background color

    },
  },
};

const RootLayout = ({ children }) => (
  <html lang="fr">
    <body>
      <AntdRegistry>
        <ConfigProvider 
            theme={config}
            locale={frFR}
          >
          {children}
       </ConfigProvider>
      </AntdRegistry>
    </body>
  </html>
);


export default RootLayout;