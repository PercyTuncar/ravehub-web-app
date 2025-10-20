"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Simple combobox without external dependencies

interface ComboboxProps {
  options: Array<{
    value: string
    label: string
    flag?: string
  }>
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  loading?: boolean
  error?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  loading = false,
  error,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between",
          !value && "text-muted-foreground",
          error && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
      >
        {loading ? (
          <span className="flex items-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Cargando...
          </span>
        ) : selectedOption ? (
          <span className="flex items-center">
            {selectedOption.flag && (
              <img
                src={selectedOption.flag}
                alt=""
                className="w-5 h-4 mr-2 rounded-sm object-cover"
              />
            )}
            {selectedOption.label}
          </span>
        ) : (
          placeholder
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          <div className="p-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {error ? (
                  <span className="text-red-600">Error: {error}</span>
                ) : (
                  "No se encontraron resultados."
                )}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center">
                    {option.flag && (
                      <img
                        src={option.flag}
                        alt=""
                        className="w-5 h-4 mr-2 rounded-sm object-cover"
                      />
                    )}
                    {option.label}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}