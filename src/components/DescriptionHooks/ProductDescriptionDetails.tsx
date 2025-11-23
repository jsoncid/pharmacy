interface SimpleRef {
  $id: string;
  description: string;
}

interface ProductDescriptionRecord {
  name: string;
  categories?: string;
  materials?: string;
  sizes?: string;
  capacityVolumes?: string;
  sterilities?: string;
  usabilities?: string;
  straps?: string;
  contents?: string;
  dosageForms?: string;
  containers?: string;
}

interface ProductDescriptionDetailsProps {
  record: ProductDescriptionRecord;
  categories?: SimpleRef[];
  materials: SimpleRef[];
  sizes: SimpleRef[];
  capacityVolumes: SimpleRef[];
  sterilities: SimpleRef[];
  usabilities: SimpleRef[];
  straps: SimpleRef[];
  contents: SimpleRef[];
  dosageForms: SimpleRef[];
  containers: SimpleRef[];
  className?: string;
}

const ProductDescriptionDetails = ({
  record,
  categories,
  materials,
  sizes,
  capacityVolumes,
  sterilities,
  usabilities,
  straps,
  contents,
  dosageForms,
  containers,
  className = "",
}: ProductDescriptionDetailsProps) => {
  const materialLabel =
    record.materials &&
    materials.find((item) => item.$id === record.materials)?.description;

  const sizeLabel =
    record.sizes && sizes.find((item) => item.$id === record.sizes)?.description;

  const capacityVolumeLabel =
    record.capacityVolumes &&
    capacityVolumes.find((item) => item.$id === record.capacityVolumes)
      ?.description;

  const sterilityLabel =
    record.sterilities &&
    sterilities.find((item) => item.$id === record.sterilities)?.description;

  const usabilityLabel =
    record.usabilities &&
    usabilities.find((item) => item.$id === record.usabilities)?.description;

  const strapLabel =
    record.straps && straps.find((item) => item.$id === record.straps)?.description;

  const contentLabel =
    record.contents &&
    contents.find((item) => item.$id === record.contents)?.description;

  const dosageFormLabel =
    record.dosageForms &&
    dosageForms.find((item) => item.$id === record.dosageForms)?.description;

  const containerLabel =
    record.containers &&
    containers.find((item) => item.$id === record.containers)?.description;

  const categoryLabel =
    record.categories &&
    categories?.find((item) => item.$id === record.categories)?.description;

  const rootClassName = className
    ? `flex flex-col ${className}`
    : "flex flex-col";

  return (
    <div className={rootClassName}>
      <span>{record.name}</span>
      {categoryLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Category: {categoryLabel}
        </span>
      )}
      {materialLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Material: {materialLabel}
        </span>
      )}
      {sizeLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Size: {sizeLabel}
        </span>
      )}
      {capacityVolumeLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Capacity: {capacityVolumeLabel}
        </span>
      )}
      {sterilityLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Sterility: {sterilityLabel}
        </span>
      )}
      {usabilityLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Usability: {usabilityLabel}
        </span>
      )}
      {strapLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Strap: {strapLabel}
        </span>
      )}
      {contentLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Contents: {contentLabel}
        </span>
      )}
      {dosageFormLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Dosage form: {dosageFormLabel}
        </span>
      )}
      {containerLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Container: {containerLabel}
        </span>
      )}
    </div>
  );
};

export default ProductDescriptionDetails;
