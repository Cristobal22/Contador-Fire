import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { EmployeeForm } from '../components/EmployeeForm';
import Modal from '../components/Modal';
import { formatRut } from '../utils/format';
import type { Employee, EmployeeData } from '../types';

const EmployeesView = () => {
    const { employees, institutions, costCenters, addEmployee, updateEmployee, deleteEmployee, addNotification, handleApiError } = useSession();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const handleAddNew = () => {
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            try {
                await deleteEmployee(id);
                addNotification({ type: 'success', message: 'Empleado eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar el empleado');
            }
        }
    };

    const handleSave = async (employeeData: EmployeeData) => {
        try {
            if (editingEmployee) {
                const { id, ...data } = employeeData as Employee;
                await updateEmployee({ ...data, id: editingEmployee.id });
                addNotification({ type: 'success', message: 'Empleado actualizado con éxito.' });
            } else {
                await addEmployee(employeeData);
                addNotification({ type: 'success', message: 'Empleado agregado con éxito.' });
            }
            setIsFormModalOpen(false);
            setEditingEmployee(null);
        } catch (error: any) {
            handleApiError(error, 'al guardar el empleado');
        }
    };
    
    const handleCloseForm = () => {
        setIsFormModalOpen(false);
        setEditingEmployee(null);
    }

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    <span className="material-symbols-outlined">add</span>Agregar Nuevo Empleado
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>RUT</th>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Sueldo Base</th>
                        <th>Fecha Contratación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {(employees && employees.length > 0) ? employees.map(emp => (
                        <tr key={emp.id}>
                            <td>{formatRut(emp.rut)}</td>
                            <td>{`${emp.name} ${emp.paternal_lastname || ''}`}</td>
                            <td>{emp.position}</td>
                            <td>{(emp.baseSalary || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
                            <td>{emp.hireDate}</td>
                            <td>
                                <button className="btn-icon" title="Editar" onClick={() => handleEdit(emp)}><span className="material-symbols-outlined">edit</span></button>
                                <button className="btn-icon" title="Eliminar" onClick={() => handleDelete(emp.id)}><span className="material-symbols-outlined">delete</span></button>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={6}>No hay empleados registrados.</td></tr>}
                </tbody>
            </table>
            
            <Modal isOpen={isFormModalOpen} onClose={handleCloseForm} title={editingEmployee ? 'Editar Empleado' : 'Agregar Nuevo Empleado'} size="xl">
                <EmployeeForm 
                    onSave={handleSave} 
                    onCancel={handleCloseForm} 
                    initialData={editingEmployee}
                    institutions={institutions || []}
                    costCenters={costCenters || []}
                />
            </Modal>
        </div>
    );
};

export default EmployeesView;
