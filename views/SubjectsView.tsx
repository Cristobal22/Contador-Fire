import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import { formatRut } from '../utils/format';
import type { Subject } from '../types';

const SubjectsView = () => {
    const session = useSession();
    return (
        <CrudView<Subject>
            title="Sujeto"
            columns={[
                { key: 'rut', header: 'RUT', render: (rut) => formatRut(rut) },
                { key: 'name', header: 'Nombre' },
                { key: 'type', header: 'Tipo' }
            ]}
            data={session.subjects}
            onSave={session.addSubject}
            onUpdate={session.updateSubject}
            onDelete={session.deleteSubject}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'type', label: 'Tipo', type: 'select', options: ['Cliente', 'Proveedor'] }
            ]}
        />
    );
};

export default SubjectsView;