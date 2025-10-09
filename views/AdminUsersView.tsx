import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { SimpleReportView } from '../components/Views';
import { supabase } from '../supabaseClient';

// Definimos la estructura de los datos de usuario que esperamos de la función
interface UserData {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    role: string;
}

const AdminUsersView = () => {
    const { addNotification } = useSession();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);

            // Llamamos a la función RPC (Remote Procedure Call) que creamos en la base de datos.
            const { data, error } = await supabase.rpc('get_all_users');

            if (error) {
                console.error('Error fetching users:', error);
                setError('No tienes permiso para ver esta sección. Se requiere rol de administrador.');
                addNotification({ type: 'error', message: 'Acceso denegado.' });
                setUsers([]);
            } else {
                setUsers(data || []);
            }
            setIsLoading(false);
        };

        fetchUsers();
    }, [addNotification]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-CL');
    }

    return (
        <SimpleReportView title="Gestión de Usuarios">
            {isLoading ? (
                <div className="loading-indicator">Cargando usuarios...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Fecha de Creación</th>
                            <th>Último Inicio de Sesión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.email}</td>
                                <td><span className={`badge role-${user.role?.toLowerCase()}`}>{user.role || 'Sin rol'}</span></td>
                                <td>{formatDate(user.created_at)}</td>
                                <td>{formatDate(user.last_sign_in_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </SimpleReportView>
    );
};

export default AdminUsersView;
