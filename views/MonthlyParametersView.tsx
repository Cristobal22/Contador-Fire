import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { MonthlyParameter } from '../types';

const MonthlyParametersView = () => {
    const session = useSession();
    const periodOptions = session.periods.map(p => ({ value: p.value, label: p.label }));

    return (
        <CrudView<MonthlyParameter>
            title="Parámetro Mensual"
            columns={[
                { key: 'period', header: 'Período' },
                { key: 'name', header: 'Nombre' },
                { key: 'value', header: 'Valor' }
            ]}
            data={session.monthlyParameters}
            onSave={session.addMonthlyParameter}
            onUpdate={session.updateMonthlyParameter}
            onDelete={session.deleteMonthlyParameter}
            formFields={[
                { name: 'period', label: 'Período', type: 'select', options: periodOptions },
                { name: 'name', label: 'Nombre', type: 'select', options: ['UF', 'UTM', 'IPC', 'Tope Imponible'] },
                { name: 'value', label: 'Valor', type: 'number' }
            ]}
        />
    );
};

export default MonthlyParametersView;