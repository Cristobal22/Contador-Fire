import type { NavStructure } from './types';

export const adminNavStructure: NavStructure = {
    "Admin": {
        icon: "shield_person",
        children: {
            "Usuarios": {
                path: "/admin/users",
                icon: "group"
            }
        }
    }
};
