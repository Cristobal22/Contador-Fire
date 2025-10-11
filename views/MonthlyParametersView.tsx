
import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { MonthlyParameter } from '../types';
import { MONTHLY_PARAMETERS } from '../utils/payroll';

const MonthlyParametersView = () => {
    const {
        periods,
        monthlyParameters,
        addMonthlyParameter,
        updateMonthlyParameter,
        deleteMonthlyParameter
    } = useSession();

    const periodOptions = periods.map(p => ({ value: p.value, label: p.label }));

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
            data={monthlyParameters}
            onSave={addMonthlyParameter}
            onUpdate={updateMonthlyParameter}
            onDelete={deleteMonthlyParameter}
            formFields={formFields}
        />
    );
};

export default MonthlyParametersView;
