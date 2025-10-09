import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { Institution } from '../types';

const InstitutionsView = () => {
    const session = useSession();
    return (
        <CrudView<Institution>
            title="Instituciones"
            columns={[
                { key: 'code', header: 'Código' },
                { key: 'name', header: 'Nombre' },
                { key: 'type', header: 'Tipo' },
                { key: 'cotizacion_obligatoria', header: 'Tasa (%)', render: (v) => v == null ? 'N/A' : v },
                { key: 'codigo_previred', header: 'Código Previred' },
                { key: 'codigo_direccion_del_trabajo', header: 'Código DT' },
                { key: 'regimen_previsional', header: 'Régimen Previsional', render: (v) => v == null ? 'N/A' : v },
            ]}
            data={session.institutions}
            onSave={session.addInstitution}
            onUpdate={session.updateInstitution}
            onDelete={session.deleteInstitution}
            formFields={[
                { name: 'code', label: 'Código', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'type', label: 'Tipo', type: 'select', options: ['afp', 'isapre', 'fonasa', 'otro'] },
                { name: 'cotizacion_obligatoria', label: 'Tasa (%)', type: 'number' },
                { name: 'codigo_previred', label: 'Código Previred', type: 'text' },
                { name: 'codigo_direccion_del_trabajo', label: 'Código DT', type: 'text' },
                { name: 'regimen_previsional', label: 'Régimen Previsional', type: 'text' },
            ]}
        />
    );
};

export default InstitutionsView;