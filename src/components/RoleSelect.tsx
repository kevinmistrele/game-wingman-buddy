import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RoleIcon, { ROLE_LABELS } from "@/components/RoleIcon";
import { ROLES, type Role } from "@/lib/eloUtils";

interface RoleSelectProps {
  label: string;
  value: Role | null;
  onChange: (role: Role | null) => void;
}

function RoleSelect({ label, value, onChange }: RoleSelectProps) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5 font-display tracking-wider">{label}</label>
      <Select value={value ?? "any"} onValueChange={(selectedValue) => onChange(selectedValue === "any" ? null : selectedValue as Role)}>
        <SelectTrigger className="bg-background border-border">
          <SelectValue>
            {value ? (
              <span className="flex items-center gap-2">
                <RoleIcon role={value} size="sm" />
                {ROLE_LABELS[value]}
              </span>
            ) : "Qualquer"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Qualquer</SelectItem>
          {ROLES.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              <span className="flex items-center gap-2">
                <RoleIcon role={role.value} size="sm" />
                {role.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default RoleSelect;
