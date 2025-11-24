import { useEffect, useMemo, useRef, useState } from "react";
import InputField from "./input/InputField";

interface SearchableSelectOption {
  value: string;
  label: string;
  data?: unknown;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  noOptionsText?: string;
  onSearchChange?: (term: string) => void;
   renderOption?: (
    option: SearchableSelectOption,
    isSelected: boolean,
  ) => React.ReactNode;
  renderSelected?: (
    option: SearchableSelectOption | undefined,
  ) => React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  value,
  defaultValue = "",
  onChange,
  disabled = false,
  className = "",
  noOptionsText = "No options found",
  onSearchChange,
  renderOption,
  renderSelected,
}) => {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedValue = isControlled ? value ?? "" : internalValue;

  // Sync internal value when defaultValue changes in uncontrolled mode
  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, searchTerm]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const selectedOptionLabel = selectedOption?.label ?? "";

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }

    onChange?.(newValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const displayText = selectedOptionLabel || placeholder;
  const hasSelection = Boolean(selectedOptionLabel);

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const term = event.target.value;
    setSearchTerm(term);
    onSearchChange?.(term);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus-within:outline-hidden focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${
          disabled
            ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 opacity-40 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800"
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`truncate ${
            hasSelection
              ? "text-gray-800 dark:text-white/90"
              : "text-gray-400 dark:text-gray-400"
          }`}
        >
          {renderSelected ? renderSelected(selectedOption) : displayText}
        </span>
        <span className="ml-2 flex h-5 w-5 items-center justify-center text-gray-500 dark:text-gray-400">
          <svg
            className={`h-4 w-4 transform stroke-current transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <InputField
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="h-9 text-sm"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                {noOptionsText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === selectedValue;

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`flex cursor-pointer items-center px-3 py-2 text-sm text-gray-700 hover:bg-primary/5 dark:text-gray-200 dark:hover:bg-white/[0.04] ${
                      isSelected ? "bg-primary/10 text-primary-600" : ""
                    }`}
                  >
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <span className="truncate">{option.label}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
