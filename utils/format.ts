
export const formatRut = (rut: string): string => {
    if (!rut) return '';
    let value = rut.replace(/\./g, '').replace('-', '');
    const body = value.slice(0, -1);
    const verifier = value.slice(-1).toUpperCase();
    let formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `${formattedBody}-${verifier}`;
};

export const unformatRut = (rut: string): string => {
    if (!rut) return '';
    return rut.replace(/\./g, '').replace('-', '');
};
