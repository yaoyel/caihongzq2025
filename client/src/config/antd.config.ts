import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorText: '#262626',
    colorTextSecondary: '#595959',
  },
  components: {
    Button: {
      borderRadius: 4,
      controlHeight: 36,
      paddingContentHorizontal: 20,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    Input: {
      borderRadius: 4,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 36,
    },
    Table: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    Modal: {
      borderRadius: 8,
      paddingContentHorizontal: 24,
      paddingContentVertical: 24,
    },
  },
}; 