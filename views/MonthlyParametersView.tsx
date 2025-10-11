
import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { MonthlyParameter } from '../types';
import { MONTHLY_PARAMETERS } from '../utils/payroll'; // Importa la nueva lista

const MonthlyParametersView = () => {
    const session = useSession();

    const periodOptions = session.periods ? session.periods.map(p => ({ value: p.value, label: p.label })) : [];

    // Define los campos del formulario usando la nueva lista de parámetros
    const formFields = [
        { name: 'period', label: 'Período', type: 'select', options: periodOptions },
        { 
            name: 'name', 
            label: 'Nombre del Parámetro', 
            type: 'select', 
            options: MONTHLY_PARAMETERS, // Usa la lista importada
            displayKey: 'label', // Le dice al GenericForm qué mostrar
            valueKey: 'value' // Le dice al GenericForm qué valor usar
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
            data={session.monthlyParameters || []}
            onSave={session.addMonthlyParameter}
            onUpdate={session.updateMonthlyParameter}
            onDelete={session.deleteMonthlyParameter}
            formFields={formFields} // Pasa los campos definidos
        />
    );
};

export default MonthlyParametersView;
