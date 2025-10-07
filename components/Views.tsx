import React from 'react';

const styles = {
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
};

export const SimpleReportView: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div style={styles.panel}><h3>{title}</h3>{children}</div>
);
