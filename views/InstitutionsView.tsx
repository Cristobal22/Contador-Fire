import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { Institution } from '../types';

const InstitutionsView = () => {
    const session = useSession();
    return (
        <CrudView<Institution>
            title="Institución"
            columns={[
                { key: 'name', header: 'Nombre' },
                { key: 'type', header: 'Tipo' },
                { key: 'rate', header: 'Tasa (%)', render: (value) => value != null ? value : 'N/A' },
            ]}
            data={session.institutions}
            onSave={session.addInstitution}
            onUpdate={session.updateInstitution}
            onDelete={session.deleteInstitution}
            formFields={[
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'type', label: 'Tipo', type: 'select', options: ['AFP', 'Isapre', 'Fonasa', 'Otro'] },
                { name: 'rate', label: 'Tasa (sólo para AFP, ej: 1.44)', type: 'number' }
            ]}
        />
    );
};

export default InstitutionsView;