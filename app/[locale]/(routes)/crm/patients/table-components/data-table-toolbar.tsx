"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import useDebounce from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearch = searchParams?.get("search") || "";
  const [searchText, setSearchText] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchText, 300);

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      const params = new URLSearchParams(searchParams?.toString());
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      router.push(`?${params.toString()}`);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchText(urlSearch);
  }, [urlSearch]);

  const isFiltered = Boolean(urlSearch) || table.getState().columnFilters.length > 0;

  const handleReset = () => {
    table.resetColumnFilters();
    setSearchText("");
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("search");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search patients by name, email, phone..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="h-8 w-[150px] lg:w-[280px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
