
import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
    tableFooter: {
        fontWeight: 'bold',
        backgroundColor: 'var(--sidebar-bg)',
    }
};

const InventoryReportView = () => {
    const { items, warehouseMovements } = useSession();

    const inventoryData = useMemo(() => {
        return items.map(item => {
            const movements = warehouseMovements.filter(m => m.itemId === item.id);
            const totalInbound = movements
                .filter(m => m.type === 'Entrada')
                .reduce((sum, m) => sum + m.quantity, 0);
            const totalOutbound = movements
                .filter(m => m.type === 'Salida')
                .reduce((sum, m) => sum + m.quantity, 0);
            const currentStock = totalInbound - totalOutbound;

            return {
                id: item.id,
                sku: item.sku,
                name: item.name,
                totalInbound,
                totalOutbound,
                currentStock,
            };
        }).sort((a, b) => a.sku.localeCompare(b.sku));
    }, [items, warehouseMovements]);

    return (
        <div style={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Ítem</th>
                        <th style={{ textAlign: 'right' }}>Entradas</th>
                        <th style={{ textAlign: 'right' }}>Salidas</th>
                        <th style={{ textAlign: 'right' }}>Stock Actual</th>
                    </tr>
                </thead>
                <tbody>
                    {inventoryData.length > 0 ? inventoryData.map(item => (
                        <tr key={item.id}>
                            <td>{item.sku}</td>
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'right' }}>{item.totalInbound}</td>
                            <td style={{ textAlign: 'right' }}>{item.totalOutbound}</td>
                            <td style={{ textAlign: 'right' }}>{item.currentStock}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5}>No hay items registrados para mostrar en el informe.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryReportView;
