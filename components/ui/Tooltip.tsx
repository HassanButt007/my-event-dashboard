import React from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    return (
        <div className="relative inline-block">
            {children}
            <div className="absolute z-10 hidden bg-gray-700 text-white text-sm rounded py-1 px-2 group-hover:block">
                {content}
            </div>
        </div>
    );
};

export default Tooltip;