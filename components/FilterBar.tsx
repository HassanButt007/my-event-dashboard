"use client";

import React, { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type FilterState = {
  search?: string;
  status?: "DRAFT" | "PUBLISHED" | "CANCELED";
  startDate?: string;
  endDate?: string;
  reminder?: "yes" | "no";
};

type FilterBarProps = {
  initialFilters?: FilterState;
  onFilterChange: (filters: FilterState) => void;
};

export default function FilterBar({ initialFilters, onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [status, setStatus] = useState<"" | "DRAFT" | "PUBLISHED" | "CANCELED">(
    (initialFilters?.status as "" | "DRAFT" | "PUBLISHED" | "CANCELED") || ""
  );
  const [startDate, setStartDate] = useState(initialFilters?.startDate || "");
  const [endDate, setEndDate] = useState(initialFilters?.endDate || "");
  const [reminder, setReminder] = useState<"" | "yes" | "no">(initialFilters?.reminder || "");


  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    onFilterChange({
      search: debouncedSearch || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      reminder: reminder || undefined,
    });
    
  }, [debouncedSearch, status, startDate, endDate, reminder]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setReminder("");
  };

  return (
    <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <Input
          label="Search"
          placeholder="Search by title or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="w-36 sm:w-44">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | "DRAFT" | "PUBLISHED" | "CANCELED")}
          options={[
            { value: "", label: "All" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "CANCELED", label: "Canceled" },
          ]}
        />
      </div>

      {/* Start Date */}
      <div className="w-36 sm:w-40">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* End Date */}
      <div className="w-36 sm:w-40">
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Reminder */}
      <div className="w-36 sm:w-44">
        <Select
          label="Reminder"
          value={reminder}
          onChange={(e) => setReminder(e.target.value as "" | "yes" | "no")}
          options={[
            { value: "", label: "All" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>

      {/* Reset Button */}
      <div className="ml-auto">
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
