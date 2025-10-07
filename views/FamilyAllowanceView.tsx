import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { FamilyAllowanceBracket } from '../types';

const FamilyAllowanceView = () => {
    const session = useSession();

    return (
        <CrudView<FamilyAllowanceBracket>
            title="Parámetro Asig. Familiar"
            columns={[
                { key: 'year', header: 'Año' },
                { key: 'semester', header: 'Semestre' },
                { key: 'tranche', header: 'Tramo' },
                { key: 'fromIncome', header: 'Renta Desde', render: (value) => value.toLocaleString('es-CL') },
                { key: 'toIncome', header: 'Renta Hasta', render: (value) => value.toLocaleString('es-CL') },
                { key: 'allowanceAmount', header: 'Monto Asignación', render: (value) => value.toLocaleString('es-CL') }
            ]}
            data={[...session.familyAllowanceBrackets].sort((a, b) => b.year - a.year || b.semester - a.semester)}
            onSave={session.addFamilyAllowanceBracket}
            onUpdate={session.updateFamilyAllowanceBracket}
            onDelete={session.deleteFamilyAllowanceBracket}
            formFields={[
                { name: 'year', label: 'Año', type: 'number' },
                { name: 'semester', label: 'Semestre', type: 'number' },
                { name: 'tranche', label: 'Tramo (ej: A)', type: 'text' },
                { name: 'fromIncome', label: 'Renta Desde', type: 'number' },
                { name: 'toIncome', label: 'Renta Hasta', type: 'number' },
                { name: 'allowanceAmount', label: 'Monto Asignación', type: 'number' },
            ]}
        />
    );
};

export default FamilyAllowanceView;