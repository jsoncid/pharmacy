import React from "react";

export interface UnorderedListItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface UnorderedListProps {
  items: UnorderedListItem[];
  className?: string;
  itemClassName?: string;
}

const UnorderedList: React.FC<UnorderedListProps> = ({
  items,
  className = "",
  itemClassName = "",
}) => {
  const rootClassName = className
    ? `rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.02] ${className}`
    : "rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.02]";

  const liClassName = itemClassName
    ? `flex items-center justify-between gap-4 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 ${itemClassName}`
    : "flex items-center justify-between gap-4 px-4 py-2 text-sm text-gray-700 dark:text-gray-200";

  return (
    <div className={rootClassName}>
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {items.map((item, index) => (
          <li key={index} className={liClassName}>
            <span className="flex-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnorderedList;
