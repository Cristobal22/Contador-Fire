import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { Employee } from '../types';

const EmployeesView = () => {
    const session = useSession();
    
    const afpOptions = (session.institutions || []).filter(i => i.type === 'AFP').map(i => ({ value: i.id, label: i.name }));
    const healthOptions = (session.institutions || []).filter(i => i.type === 'Isapre' || i.type === 'Fonasa').map(i => ({ value: i.id, label: i.name }));

    return (
        <CrudView<Employee>
            title="Empleado"
            columns={[
                { key: 'rut', header: 'RUT' },
                { key: 'name', header: 'Nombre' },
                { key: 'position', header: 'Cargo' },
                { key: 'baseSalary', header: 'Sueldo Base', render: (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }) },
                { key: 'hireDate', header: 'Fecha Contratación' }
            ]}
            data={session.employees}
            onSave={session.addEmployee}
            onUpdate={session.updateEmployee}
            onDelete={session.deleteEmployee}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text' },
                { name: 'name', label: 'Nombre', type: 'text' },
                { name: 'position', label: 'Cargo', type: 'text' },
                { name: 'hireDate', label: 'Fecha Contratación', type: 'date' },
                { name: 'baseSalary', label: 'Sueldo Base', type: 'number' },
                { name: 'afpId', label: 'AFP', type: 'select', options: afpOptions },
                { name: 'healthId', label: 'Sistema de Salud', type: 'select', options: healthOptions },
            ]}
        />
    );
};

export default EmployeesView;