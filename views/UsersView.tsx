import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Modal } from '../components/Modal';
import { GenericForm } from '../components/Forms';
import type { User, UserData } from '../types';

const UsersView = () => {
    const { addNotification, currentUser, handleApiError, ...session } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<User | (Omit<User, 'id'> & { password?: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Display all users, sorted by name
    const users = [...session.users].sort((a, b) => a.name.localeCompare(b.name));

    const formFieldsEdit = [
        { name: 'name', label: 'Nombre Completo', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'company_limit', label: 'Límite de Empresas', type: 'number' },
        { name: 'status', label: 'Estado', type: 'select', options: [
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
        ]}
    ];

    const formFieldsCreate = [
        ...formFieldsEdit,
        { name: 'password', label: 'Contraseña Temporal', type: 'password' },
    ];
    
    const handleAddNew = () => {
        setEditingItem({
            name: '',
            email: '',
            company_limit: 1,
            status: 'active',
            role: 'Accountant',
            password: '',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: User) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            addNotification({ type: 'error', message: 'No puede eliminar su propio usuario.' });
            return;
        }
        if (window.confirm('¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                await session.deleteUser(id);
                addNotification({ type: 'success', message: 'Usuario eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar usuario');
            }
        }
    };

    const handleSave = async (formData: any) => {
        setIsLoading(true);
        setLoadingMessage('');
        const isEditing = editingItem && 'id' in editingItem;
        
        try {
            if (isEditing) {
                const finalUpdateData: User = { ...(editingItem as User), ...formData };
                await session.updateUser(finalUpdateData);
            } else {
                const { password, ...userData } = formData;
                if (!password) {
                    throw new Error("La contraseña es obligatoria para nuevos usuarios.");
                }
                const finalUserData: UserData = { ...userData, role: 'Accountant' };
                await session.addUser(finalUserData, password, setLoadingMessage);
            }
            addNotification({ type: 'success', message: `Usuario ${isEditing ? 'actualizado' : 'guardado'} con éxito.` });
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error: any) {
            handleApiError(error, 'al guardar usuario');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const isEditing = editingItem && 'id' in editingItem;

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    <span className="material-symbols-outlined">add</span>Agregar Usuario Contador
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Límite Empresas</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? users.map(item => {
                        const isCurrentUser = item.id === currentUser?.id;
                        return (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.email}</td>
                                <td>{item.role === 'System Administrator' ? 'Administrador' : 'Contador'}</td>
                                <td>{item.status === 'active' ? 'Activo' : 'Inactivo'}</td>
                                <td>{item.role === 'Accountant' ? item.company_limit : 'N/A'}</td>
                                <td>
                                    <button 
                                        className="btn-icon" 
                                        title="Editar" 
                                        onClick={() => handleEdit(item)} 
                                        disabled={isCurrentUser}
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button 
                                        className="btn-icon" 
                                        title="Eliminar" 
                                        onClick={() => handleDelete(item.id)} 
                                        disabled={isCurrentUser}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        )
                    }) : (
                        <tr><td colSpan={6}>No hay usuarios registrados.</td></tr>
                    )}
                </tbody>
            </table>
            <Modal isOpen={isModalOpen} onClose={handleCancel} title={(isEditing ? 'Editar' : 'Agregar') + ' Usuario'}>
                {editingItem && (
                    <GenericForm
                        onSave={handleSave}
                        onCancel={handleCancel}
                        initialData={editingItem}
                        fields={isEditing ? formFieldsEdit : formFieldsCreate}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                    />
                )}
            </Modal>
        </div>
    );
};

export default UsersView;