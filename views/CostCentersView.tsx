import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { CostCenter } from '../types';

const CostCentersView = () => {
    const session = useSession();
    return (
        <CrudView<CostCenter>
            title="Centro de Costo"
            columns={[
                { key: 'code', header: 'Código' },
                { key: 'name', header: 'Nombre' }
            ]}
            data={session.costCenters}
            onSave={session.addCostCenter}
            onUpdate={session.updateCostCenter}
            onDelete={session.deleteCostCenter}
            formFields={[
                { name: 'code', label: 'Código', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' }
            ]}
        />
    );
};

export default CostCentersView;