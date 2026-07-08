import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { NAV_SECTIONS } from "@/constants/navigation";

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const go = (to) => { navigate(to); onOpenChange(false); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search modules, projects, drawings, people…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.label}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={section.label}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.to} onSelect={() => go(item.to)}>
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
