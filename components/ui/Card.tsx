
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, description, icon, headerAction }) => {
  return (
    <div className={`
      bg-[#171717] 
      border border-[#2e2e2e] 
      rounded-xl overflow-hidden 
      transition-all duration-300
      hover:border-primary/30
      hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
      group
      ${className}
    `}>
      {(title || description || icon) && (
        <div className="px-6 py-5 border-b border-[#2e2e2e] flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 transition-colors group-hover:bg-primary/10">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.15em]">{title}</h3>}
              {description && <p className="text-[10px] text-muted font-medium mt-0.5">{description}</p>}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
