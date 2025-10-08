
export const formatRut = (rut: string): string => {
    let value = rut.replace(/\./g, '').replace('-', '');
    if (value.match(/^(\d{2})(\d{3})(\d{3})([0-9kK])$/)) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})([0-9kK])$/, '$1.$2.$3-$4');
    } else if (value.match(/^(\d)(\d{3})(\d{3})([0-9kK])$/)) {
        value = value.replace(/^(\d)(\d{3})(\d{3})([0-9kK])$/, '$1.$2.$3-$4');
    }
    return value;
};
