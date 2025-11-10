"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = false, // ❗ hide outside days by default
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-4 rounded-lg shadow-sm border w-fit",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit"),
        months: cn("flex flex-col sm:flex-row sm:space-x-4"),
        month: cn("space-y-4"),
        nav: cn("flex items-center justify-between mb-2"),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 opacity-70 hover:opacity-100"
        ),
        month_caption: cn("flex items-center justify-center mb-2 text-sm font-semibold"),
        table: cn("w-full border-collapse"),
        head_row: cn("flex justify-between"),
        head_cell: cn(
          "text-muted-foreground w-9 font-medium text-[0.8rem] text-center"
        ),
        row: cn("flex justify-between w-full"),
        cell: cn("relative h-9 w-9 text-center text-sm"),
        day: cn(
          "h-9 w-9 p-0 font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-md transition-colors"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        day_today:
          "bg-accent text-accent-foreground font-semibold border border-border",
        day_outside: "text-muted-foreground opacity-40", // ✅ lighter gray for outside days
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className="h-4 w-4" {...props} />
          if (orientation === "right")
            return <ChevronRightIcon className="h-4 w-4" {...props} />
          return <ChevronDownIcon className="h-4 w-4" {...props} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isOutside = modifiers.outside
  const isSelected = modifiers.selected
  const isToday = modifiers.today

  return (
    <Button
      ref={ref}
      variant={isSelected ? "default" : "ghost"}
      size="icon"
      className={cn(
        "h-9 w-9 text-sm font-medium rounded-md transition-colors",
        isToday && "border border-border bg-accent text-accent-foreground",
        isOutside
          ? "text-muted-foreground opacity-40" // ✅ outside days: light gray
          : "text-foreground", // ✅ current month days: dark text
        className
      )}
      {...props}
    >
      {day.date.getDate()}
    </Button>
  )
}

export { Calendar, CalendarDayButton }
