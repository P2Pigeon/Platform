import React from 'react';
export interface SidebarProps {
    items: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        active?: boolean;
    }[];
    header?: React.ReactNode;
    footer?: React.ReactNode;
}
export declare const Sidebar: React.FC<SidebarProps>;
//# sourceMappingURL=Sidebar.d.ts.map