export const theme = {
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    background: '#f0f2f5',
    text: {
      primary: '#262626',
      secondary: '#595959',
      disabled: '#bfbfbf',
    },
  },
  shadows: {
    small: '0 2px 8px rgba(0,0,0,0.15)',
    medium: '0 4px 12px rgba(0,0,0,0.15)',
    large: '0 8px 24px rgba(0,0,0,0.15)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export type Theme = typeof theme; 