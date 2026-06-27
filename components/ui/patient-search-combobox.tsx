"use client";

import { useState, useEffect, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import useDebounce from "@/hooks/useDebounce";
import { searchContacts } from "@/actions/crm/contacts/search-contacts";

type ContactItem = { id: string; name: string };

interface PatientSearchComboboxProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

const PAGE_SIZE = 50;

export function PatientSearchCombobox({
  value,
  onChange,
  placeholder = "Select patient",
  disabled,
  name,
}: PatientSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [accumulatedContacts, setAccumulatedContacts] = useState<ContactItem[]>([]);
  const [listData, setListData] = useState<{
    users: ContactItem[];
    hasMore: boolean;
  } | null>(null);
  const [singleContact, setSingleContact] = useState<ContactItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebounce(search, 300);

  const selectedInList = accumulatedContacts.find((c) => c.id === value);

  // Load list of contacts when open
  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const data = await searchContacts({
        search: debouncedSearch,
        skip,
        take: PAGE_SIZE,
      });
      setListData(data);
    });
  }, [open, debouncedSearch, skip]);

  // Accumulate contacts across pages
  useEffect(() => {
    if (listData?.users) {
      if (skip === 0) {
        setAccumulatedContacts(listData.users);
      } else {
        setAccumulatedContacts((prev) => [...prev, ...listData.users]);
      }
    }
  }, [listData, skip]);

  // Reset on search change
  useEffect(() => {
    setSkip(0);
    setAccumulatedContacts([]);
    setListData(null);
  }, [debouncedSearch]);

  // Load selected contact name if not in list
  useEffect(() => {
    if (!value || selectedInList) return;
    startTransition(async () => {
      const result = await searchContacts({ contactId: value });
      if (result.users && result.users.length > 0) {
        setSingleContact(result.users[0]);
      }
    });
  }, [value, selectedInList]);

  const displayContact = selectedInList ?? singleContact ?? null;

  const handleSelect = (contactId: string) => {
    onChange(contactId === value ? "" : contactId);
    setOpen(false);
  };

  const isLoading = isPending && skip === 0 && accumulatedContacts.length === 0;

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal text-sm"
            disabled={disabled}
            type="button"
          >
            <span className="truncate">
              {displayContact?.name ?? (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search patients..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList onWheelCapture={(e) => e.stopPropagation()}>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <>
                  <CommandEmpty>No patients found.</CommandEmpty>
                  <CommandGroup>
                    {accumulatedContacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={contact.id}
                        onSelect={handleSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === contact.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {contact.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {listData?.hasMore && (
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        type="button"
                        onClick={() => setSkip((prev) => prev + PAGE_SIZE)}
                        disabled={isPending}
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
