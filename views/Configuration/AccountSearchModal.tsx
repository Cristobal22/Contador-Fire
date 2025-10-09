
import React, { useState, useMemo } from 'react';
import { Modal, Form, Table, Button } from 'react-bootstrap';
import type { Account } from '../../types';

interface AccountSearchModalProps {
    show: boolean;
    onHide: () => void;
    onSelectAccount: (accountCode: string) => void;
    accounts: Account[];
}

export const AccountSearchModal: React.FC<AccountSearchModalProps> = ({ show, onHide, onSelectAccount, accounts }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) {
            return accounts;
        }
        return accounts.filter(account =>
            account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [accounts, searchTerm]);

    const handleSelect = (code: string) => {
        onSelectAccount(code);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Buscar Cuenta Contable</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Form.Group>
                <Table striped bordered hover responsive size="sm">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAccounts.map(account => (
                            <tr key={account.id}>
                                <td>{account.code}</td>
                                <td>{account.name}</td>
                                <td>{account.type}</td>
                                <td className="text-center">
                                    <Button variant="primary" size="sm" onClick={() => handleSelect(account.code)}>
                                        Seleccionar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
};
