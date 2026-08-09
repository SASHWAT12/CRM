import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { getProductsFull } from "@/actions/crm/products/get-products";
import { getProductCategories } from "@/actions/crm/products/get-product-categories";
import ProductsView from "../components/ProductsView";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

const ProductsPage = async () => {
  const [products, categories] = await Promise.all([
    getProductsFull(),
    getProductCategories(),
  ]);

  const serializedProducts = serializeDecimalsList(products);

  return (
    <Container
      title="Treatments"
      description="Manage your treatment and service catalog"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <ProductsView
          data={serializedProducts}
          categories={categories}
        />
      </Suspense>
    </Container>
  );
};

export default ProductsPage;
