
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { EmployeeForm } from '../components/EmployeeForm';
import Modal from '../components/Modal';
import { formatRut } from '../utils/format';
import type { Employee, EmployeeData } from '../types';
import { CrudView } from '../components/CrudView';

const EmployeesView: React.FC = () => {
    const { session, loading, addNotification, handleApiError } = useSession();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const employees = session?.employees || [];
    const institutions = session?.institutions || [];
    const costCenters = session?.costCenters || [];

    const handleAddNew = () => {
        setSelectedEmployee(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!session?.deleteEmployee) return;
        if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            try {
                await session.deleteEmployee(id);
                addNotification({ type: 'success', message: 'Empleado eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar el empleado');
            }
        }
    };

    const handleSave = async (employeeData: EmployeeData) => {
        if (!session?.addEmployee || !session?.updateEmployee) return;
        setIsSubmitting(true);
        try {
            if (selectedEmployee) {
                await session.updateEmployee({ ...employeeData, id: selectedEmployee.id });
                addNotification({ type: 'success', message: 'Empleado actualizado con éxito.' });
            } else {
                await session.addEmployee(employeeData);
                addNotification({ type: 'success', message: 'Empleado agregado con éxito.' });
            }
            setIsFormModalOpen(false);
            setSelectedEmployee(null);
        } catch (error: any) {
            handleApiError(error, 'al guardar el empleado');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const columns = [
        { id: 'rut', header: 'RUT', accessor: (emp: Employee) => formatRut(emp.rut) },
        { id: 'name', header: 'Nombre', accessor: (emp: Employee) => `${emp.name} ${emp.paternal_lastname || ''}` },
        { id: 'position', header: 'Cargo', accessor: (emp: Employee) => emp.position },
        {
            id: 'baseSalary',
            header: 'Sueldo Base',
            accessor: (emp: Employee) => (emp.baseSalary || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }),
        },
        { id: 'hireDate', header: 'Fecha Contratación', accessor: (emp: Employee) => emp.hireDate },
    ];

    return (
        <CrudView
            title="Ficha de Personal"
            data={employees}
            columns={columns}
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDelete={(emp) => handleDelete(emp.id)}
            loading={loading}
            companyRequired
        >
            {isFormModalOpen && (
                 <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedEmployee ? 'Editar Empleado' : 'Agregar Nuevo Empleado'} size="xl">
                    <EmployeeForm 
                        onSave={handleSave} 
                        onCancel={() => setIsFormModalOpen(false)} 
                        initialData={selectedEmployee}
                        institutions={institutions}
                        costCenters={costCenters}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            )}
        </CrudView>
    );
};

export default EmployeesView;
