"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/contexts/auth-context"
import { FormControl } from "@/components/ui/form"
import { firebaseService, COLLECTIONS } from "@/lib/firebase-service"

interface Customer {
  id: string
  name: string
  phone: string
  alternatePhone?: string
  address?: string
  email?: string
}

interface JobCardData {
  id: string
  customerName?: string
  phone?: string
  alternatePhone?: string
  address?: string
}

interface CustomerAutocompleteProps {
  value: string
  onSelect: (customer: Customer | null) => void
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomerAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Search or enter customer name...",
}: CustomerAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null)
  const { user } = useAuth()

  // Fetch unique customers from job cards (most accurate source)
  const fetchCustomersFromJobCards = React.useCallback(async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      // Get all job cards
      const jobCards = await firebaseService.getAll<JobCardData>(user.uid, COLLECTIONS.JOB_CARDS)
      
      // Extract unique customers by phone number (phone is unique identifier)
      const customerMap = new Map<string, Customer>()
      
      jobCards.forEach((jobCard) => {
        if (jobCard.customerName && jobCard.phone) {
          // Use phone as key to avoid duplicates
          const key = jobCard.phone
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              id: jobCard.id, // Use job card ID as reference
              name: jobCard.customerName,
              phone: jobCard.phone,
              alternatePhone: jobCard.alternatePhone || "",
              address: jobCard.address || "",
            })
          } else {
            // If customer exists, update with latest data (newest job card wins)
            const existing = customerMap.get(key)!
            customerMap.set(key, {
              ...existing,
              name: jobCard.customerName,
              alternatePhone: jobCard.alternatePhone || existing.alternatePhone,
              address: jobCard.address || existing.address,
            })
          }
        }
      })
      
      setCustomers(Array.from(customerMap.values()))
    } catch (error) {
      console.error("Error fetching customers from job cards:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  // Initial fetch on mount
  React.useEffect(() => {
    fetchCustomersFromJobCards()
  }, [fetchCustomersFromJobCards])

  // Refetch when popover opens to ensure latest data & reset search query
  React.useEffect(() => {
    if (open) {
      setSearchQuery("")
      fetchCustomersFromJobCards() // Refresh customer list every time popover opens
    }
  }, [open, fetchCustomersFromJobCards])

  // Filter customers based on search query (not the selected value)
  const filteredCustomers = React.useMemo(() => {
    if (!searchQuery.trim()) return customers
    const searchTerm = searchQuery.toLowerCase().trim()
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm))
    )
  }, [customers, searchQuery])

  const handleSelect = (customer: Customer) => {
    onChange(customer.name)
    setSelectedCustomerId(customer.id)
    onSelect(customer)
    setOpen(false)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  // Handle using the search query as a new customer name
  const handleUseNewCustomer = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim())
      setSelectedCustomerId(null)
      onSelect(null) // Clear any previous selection
      setOpen(false)
    }
  }

  // When popover closes, if there's a search query and no selection, use it as new customer
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && searchQuery.trim() && !selectedCustomerId) {
      // If closing with a search query and no customer selected, use the search query
      const matchingCustomer = customers.find(
        c => c.name.toLowerCase() === searchQuery.toLowerCase()
      )
      if (!matchingCustomer) {
        onChange(searchQuery.trim())
        onSelect(null)
      }
    }
    setOpen(isOpen)
  }

  // Check if current value matches a customer (for showing check mark)
  const isCustomerSelected = (customer: Customer) => {
    return selectedCustomerId === customer.id || 
           value.toLowerCase() === customer.name.toLowerCase()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 opacity-50" />
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type customer name or phone..."
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading customers...
              </div>
            ) : (
              <>
                {/* Show "Add new customer" option when there's a search query */}
                {searchQuery.trim() && (
                  <CommandGroup heading="New Customer">
                    <CommandItem
                      value="new-customer"
                      onSelect={handleUseNewCustomer}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span>Add &quot;{searchQuery.trim()}&quot; as new customer</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}
                
                {/* Show existing customers */}
                {filteredCustomers.length > 0 && (
                  <CommandGroup heading={`Existing Customers (${filteredCustomers.length})`}>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleSelect(customer)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                isCustomerSelected(customer) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          <div className="ml-6 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{customer.phone}</span>
                            {customer.address && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{customer.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* Show message when no customers and no search query */}
                {filteredCustomers.length === 0 && !searchQuery.trim() && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No customers yet. Start typing to add one.
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

