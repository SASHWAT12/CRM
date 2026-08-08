"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import UpdateProductForm from "@/app/[locale]/(routes)/crm/products/_forms/update-product";
import type { crm_ProductCategories } from "@prisma/client";

interface EditProductButtonProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    type: string;
    status: string;
    unit_price: number;
    unit_cost: number | null;
    tax_rate: number | null;
    unit: string | null;
    is_recurring: boolean;
    billing_period: string | null;
    category: { id: string; name: string } | null;
  };
  categories: crm_ProductCategories[];
}

export function EditProductButton({
  product,
  categories,
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <UpdateProductForm
        onOpen={open}
        setOpen={setOpen}
        product={product}
        categories={categories}
      />
    </>
  );
}
