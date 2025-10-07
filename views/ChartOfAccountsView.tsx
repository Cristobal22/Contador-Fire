import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { ChartOfAccount } from '../types';

const ChartOfAccountsView = () => {
    const session = useSession();
    return (
        <CrudView<ChartOfAccount>
            title="Cuenta"
            columns={[
                { key: 'code', header: 'Código' },
                { key: 'name', header: 'Nombre' },
                { key: 'type', header: 'Tipo' }
            ]}
            data={session.accounts}
            onSave={session.addAccount}
            onUpdate={session.updateAccount}
            onDelete={session.deleteAccount}
            formFields={[
                { name: 'code', label: 'Código', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'type', label: 'Tipo', type: 'select', options: ['Activo', 'Pasivo', 'Patrimonio', 'Resultado'] }
            ]}
        />
    );
};

export default ChartOfAccountsView;