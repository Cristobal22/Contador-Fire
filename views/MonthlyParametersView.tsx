
import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { MonthlyParameter } from '../types';
import { MONTHLY_PARAMETERS } from '../utils/payroll';

const MonthlyParametersView = () => {
    const session = useSession();

    // -- SOLUCIÓN --
    // Si la sesión o los datos esenciales aún no están cargados, muestra un estado de carga.
    // Esto previene que el componente intente renderizar con datos `undefined`.
    if (!session || !session.monthlyParameters || !session.periods) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p>Cargando parámetros...</p>
            </div>
        );
    }

    const periodOptions = session.periods.map(p => ({ value: p.value, label: p.label }));

    const formFields = [
        { name: 'period', label: 'Período', type: 'select', options: periodOptions },
        {
            name: 'name',
            label: 'Nombre del Parámetro',
            type: 'select',
            options: MONTHLY_PARAMETERS,
            displayKey: 'label',
            valueKey: 'value'
        },
        { name: 'value', label: 'Valor', type: 'number' }
    ];

    return (
        <CrudView<MonthlyParameter>
            title="Parámetro Mensual"
            columns={[
                { key: 'period', header: 'Período' },
                { key: 'name', header: 'Nombre' },
                { key: 'value', header: 'Valor' }
            ]}
            data={session.monthlyParameters} // Ya no es necesario el `|| []` por el chequeo de carga.
            onSave={session.addMonthlyParameter}
            onUpdate={session.updateMonthlyParameter}
            onDelete={session.deleteMonthlyParameter}
            formFields={formFields}
        />
    );
};

export default MonthlyParametersView;
