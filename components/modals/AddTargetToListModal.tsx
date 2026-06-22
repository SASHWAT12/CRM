"use client";

interface AddTargetToListModalProps {
  targetListId: string;
  existingTargetIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTargetToListModal = ({
  targetListId,
  existingTargetIds,
  open,
  onOpenChange,
}: AddTargetToListModalProps) => {
  return null;
};

export default AddTargetToListModal;
