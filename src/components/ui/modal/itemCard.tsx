import React from "react";

interface ItemCardProps {
  title: string;
  description?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const ItemCard: React.FC<ItemCardProps> = ({
  title,
  description,
  linkLabel,
  onLinkClick,
  className,
  children,
}) => {
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 " +
        (className ?? "")
      }
    >
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {children}
        {linkLabel && onLinkClick && (
          <button
            type="button"
            onClick={onLinkClick}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline"
          >
            {linkLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
