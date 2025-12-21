import type { ComponentProps } from "react";
import SearchableSelect from "./SearchableSelect";
import Button from "../ui/button/Button";

// Reuse all props from the base SearchableSelect
type BaseSearchableSelectProps = ComponentProps<typeof SearchableSelect>;

interface SearchableSelectWithAddProps extends BaseSearchableSelectProps {
  onAdd: (collectionId: string) => void;
  collectionId: string;
  addButtonLabel?: string;
  addButtonDisabled?: boolean;
  addButtonClassName?: string;
}

const SearchableSelectWithAdd: React.FC<SearchableSelectWithAddProps> = ({
  onAdd,
  collectionId,
  addButtonLabel = "+",
  addButtonDisabled = false,
  addButtonClassName = "bg-green-600 hover:bg-green-700",
  className,
  ...selectProps
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchableSelect {...selectProps} className={className} />
      </div>
      <Button
        size="sm"
        variant="primary"
        className={addButtonClassName}
        onClick={() => onAdd(collectionId)}
        disabled={addButtonDisabled}
        type="button"
      >
        {addButtonLabel}
      </Button>
    </div>
  );
};

export default SearchableSelectWithAdd;
