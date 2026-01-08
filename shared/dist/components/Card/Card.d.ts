import React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'standard' | 'status' | 'meeting' | 'feature';
    statusColor?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}
export declare const Card: React.FC<CardProps>;
//# sourceMappingURL=Card.d.ts.map