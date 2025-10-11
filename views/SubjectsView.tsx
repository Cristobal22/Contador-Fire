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
                { key: 'type', header: 'Tipo' },
                { key: 'has_solidarity_loan', header: 'Préstamo Solidario', render: (value) => value ? 'Sí' : 'No' }
            ]}
            data={session.subjects}
            onSave={(data) => session.addSubject(data)}
            onUpdate={(data) => session.updateSubject(data)}
            onDelete={(id) => session.deleteSubject(id)}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text', required: true },
                { name: 'name', label: 'Nombre', type: 'text', required: true },
                { name: 'type', label: 'Tipo', type: 'select', options: ['Cliente', 'Proveedor'], required: true },
                { name: 'has_solidarity_loan', label: 'Aplica Retención Préstamo Solidario (3%)', type: 'checkbox' }
            ]}
            initialData={{ rut: '', name: '', type: 'Proveedor', has_solidarity_loan: false }}
        />
    );
};

export default SubjectsView;