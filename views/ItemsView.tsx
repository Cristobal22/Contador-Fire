import React, { useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { Item } from '../types';

const ItemsView = () => {
    const session = useSession();

    const itemStock = useMemo(() => {
        const stockMap = new Map<number, number>();
        session.warehouseMovements.forEach(movement => {
            const currentStock = stockMap.get(movement.itemId) || 0;
            if (movement.type === 'Entrada') {
                stockMap.set(movement.itemId, currentStock + movement.quantity);
            } else {
                stockMap.set(movement.itemId, currentStock - movement.quantity);
            }
        });
        return stockMap;
    }, [session.warehouseMovements]);


    return (
        <CrudView<Item>
            title="Ítem"
            columns={[
                { key: 'sku', header: 'SKU' },
                { key: 'name', header: 'Nombre' },
                { key: 'stock', header: 'Stock Actual', render: (_, item) => itemStock.get(item.id) || 0 }
            ]}
            data={session.items}
            onSave={session.addItem}
            onUpdate={session.updateItem}
            onDelete={session.deleteItem}
            formFields={[
                { name: 'sku', label: 'SKU', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' }
            ]}
        />
    );
};

export default ItemsView;