"use client";

import React, { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { IoMdFunnel } from "react-icons/io";

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

  const [isOpen, setIsOpen] = useState(false);
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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <h3 className="font-semibold text-gray-700">Filters</h3>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100"
        >
          <IoMdFunnel className="w-4 h-4" />
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {/* Filters grid */}
      <div
        className={`mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-300 ${isOpen ? "max-h-screen opacity-100" : "max-h-0 overflow-hidden opacity-0 lg:opacity-100 lg:max-h-screen"
          }`}
      >
        {/* Search */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <Input
            label="Search"
            placeholder="Search by title or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
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
        <div>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Reminder */}
        <div>
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
        <div className="flex items-end">
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
