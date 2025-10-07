import React from 'react';
import { useSession } from '../../context/SessionContext';
import { CrudView } from '../../components/CrudView';
import type { AccountGroup } from '../../types';

const AccountGroupsView = () => {
    const session = useSession();
    return (
        <CrudView<AccountGroup>
            title="Grupo de Cuentas"
            columns={[
                { key: 'code', header: 'Código' },
                { key: 'name', header: 'Nombre' },
                { key: 'transitionalType', header: 'Transitorio', render: (value) => value === 'balance' ? 'Cuentas de Balance' : 'Cuentas de Resultado' },
                { key: 'movementType', header: 'Tipo Movimiento', render: (value) => value === 'debtor' ? 'Deudora' : 'Acreedora' },
            ]}
            data={session.accountGroups}
            onSave={session.addAccountGroup}
            onUpdate={session.updateAccountGroup}
            onDelete={session.deleteAccountGroup}
            formFields={[
                { name: 'code', label: 'Código', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'format', label: 'Formato Centro', type: 'text' },
                { name: 'levels', label: 'Número de Niveles', type: 'number' },
                { name: 'transitionalType', label: 'Transitorio', type: 'select', options: [
                    { value: 'balance', label: 'Cuentas de Balance' },
                    { value: 'result', label: 'Cuentas de Resultado' },
                ]},
                { name: 'movementType', label: 'Tipo Movimientos', type: 'select', options: [
                    { value: 'debtor', label: 'Deudora' },
                    { value: 'creditor', label: 'Acreedora' },
                ]},
                { name: 'length', label: 'Longitud', type: 'number' },
            ]}
        />
    );
};

export default AccountGroupsView;